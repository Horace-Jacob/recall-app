import Database from 'better-sqlite3';
import { embed, generateAIAnswer } from './ai-processor';
import { AIResponse, Memory, RankedMemory, SearchResult } from '../types';

const CONFIG = {
  TOP_K_RESULTS: 50,
  MAX_RESULTS_TO_USER: 5,

  MIN_SIMILARITY: 0.3,
  WEAK_MATCH_THRESHOLD: 0.42,
  CONFIDENT_MATCH_THRESHOLD: 0.68,

  SIMILARITY_WEIGHT: 0.7,
  RECENCY_WEIGHT: 0.25,
  RECENCY_DECAY_DAYS: 60
};

const AI_GATE = {
  MAX_SOURCES_FOR_AI: 5,

  // New: Similarity thresholds for different query types
  PERFECT_MATCH_THRESHOLD: 0.9, // Skip AI only if near-perfect match
  NAVIGATIONAL_THRESHOLD: 0.7, // Lower bar for "find that article" queries
  DEFAULT_THRESHOLD: 0.75 // Default for other queries
};

// ============================================================================
// VECTOR OPERATIONS (unchanged)
// ============================================================================

function bufferToEmbedding(buffer: Buffer): number[] {
  const float32Array = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
  return Array.from(float32Array);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);

  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dotProduct / (magA * magB);
}

// ============================================================================
// VECTOR SIMILARITY SEARCH (unchanged)
// ============================================================================

function searchSimilarMemories(
  db: Database.Database,
  queryEmbedding: number[],
  userId: string
): RankedMemory[] {
  const stmt = db.prepare(`
    SELECT
      id, url, title, content, summary, intent, embedding, created_at, source_type
    FROM memories
    WHERE user_id = ?
  `);

  const memories = stmt.all(userId) as Memory[];

  if (memories.length === 0) {
    return [];
  }

  const now = Date.now();
  const results: RankedMemory[] = [];

  for (const memory of memories) {
    try {
      if (!memory.embedding) {
        continue;
      }

      const memoryEmbedding = bufferToEmbedding(memory.embedding);

      if (memoryEmbedding.length !== queryEmbedding.length) {
        continue;
      }

      const similarity = cosineSimilarity(queryEmbedding, memoryEmbedding);

      if (similarity < CONFIG.MIN_SIMILARITY) {
        continue;
      }

      const createdAt = new Date(memory.created_at).getTime();
      const daysSince = (now - createdAt) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.exp(-daysSince / CONFIG.RECENCY_DECAY_DAYS);

      const finalScore =
        similarity * CONFIG.SIMILARITY_WEIGHT + recencyScore * CONFIG.RECENCY_WEIGHT;

      results.push({
        ...memory,
        similarity,
        recencyScore,
        finalScore
      });
    } catch (error) {
      continue;
    }
  }

  results.sort((a, b) => b.finalScore - a.finalScore);

  return results.slice(0, CONFIG.TOP_K_RESULTS);
}

// ============================================================================
// SMART DEDUPLICATION (unchanged)
// ============================================================================

function calculateTitleSimilarity(title1: string, title2: string): number {
  const words1 = new Set(
    title1
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );
  const words2 = new Set(
    title2
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );

  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

function deduplicateResults(memories: RankedMemory[]): RankedMemory[] {
  const kept: RankedMemory[] = [];

  for (const memory of memories) {
    const isDuplicate = kept.some((existing) => {
      try {
        const sameDomain = new URL(memory.url).hostname === new URL(existing.url).hostname;
        const titleSimilarity = calculateTitleSimilarity(memory.title, existing.title);

        return sameDomain && titleSimilarity > 0.8;
      } catch {
        return false;
      }
    });

    if (!isDuplicate) {
      kept.push(memory);
    }
  }

  return kept;
}

// ============================================================================
// QUERY INTENT DETECTION (NEW & IMPROVED)
// ============================================================================

interface QueryIntent {
  type: 'question' | 'synthesis' | 'navigational' | 'general';
  needsAIAnswer: boolean;
  confidence: 'high' | 'medium' | 'low';
}

function analyzeQueryIntent(
  query: string,
  topResult: RankedMemory,
  deduped: RankedMemory[]
): QueryIntent {
  const lowerQuery = query.toLowerCase().trim();

  // ========================================
  // 1. QUESTION DETECTION
  // ========================================
  const questionWords = ['who', 'what', 'when', 'where', 'why', 'how', 'which', 'whose'];
  const hasQuestionWord = questionWords.some((word) =>
    new RegExp(`\\b${word}\\b`).test(lowerQuery)
  );
  const hasQuestionMark = query.includes('?');

  // ========================================
  // 2. SYNTHESIS DETECTION
  // ========================================
  const synthesisKeywords = [
    'compare',
    'comparison',
    'difference between',
    'vs',
    'versus',
    'pros and cons',
    'tradeoff',
    'tradeoffs',
    'summarize',
    'summary',
    'overview',
    'synthesize',
    'connect',
    'relationship between',
    'what did i learn',
    'tell me about',
    'explain'
  ];
  const hasSynthesisIntent = synthesisKeywords.some((keyword) => lowerQuery.includes(keyword));

  // ========================================
  // 3. NAVIGATIONAL DETECTION
  // ========================================
  const navigationalKeywords = [
    'find',
    'show me',
    'get',
    'open',
    'article about',
    'page about',
    'link to',
    'where is',
    'do i have'
  ];
  const isNavigational = navigationalKeywords.some((keyword) => lowerQuery.includes(keyword));

  // ========================================
  // 4. DECISION LOGIC
  // ========================================

  // CASE 1: It's a direct question
  if (hasQuestionWord || hasQuestionMark) {
    // Only skip AI if it's a near-perfect match AND not asking for synthesis
    const skipAI = topResult.similarity >= AI_GATE.PERFECT_MATCH_THRESHOLD && !hasSynthesisIntent;

    return {
      type: 'question',
      needsAIAnswer: !skipAI,
      confidence: topResult.similarity >= 0.75 ? 'high' : 'medium'
    };
  }

  // CASE 2: It's a synthesis request
  if (hasSynthesisIntent) {
    // Always use AI for synthesis (unless perfect single match)
    const skipAI = topResult.similarity >= AI_GATE.PERFECT_MATCH_THRESHOLD && deduped.length === 1;

    return {
      type: 'synthesis',
      needsAIAnswer: !skipAI,
      confidence: deduped.length >= 2 ? 'high' : 'medium'
    };
  }

  // CASE 3: It's navigational (just wants the article)
  if (isNavigational) {
    const skipAI = topResult.similarity >= AI_GATE.NAVIGATIONAL_THRESHOLD;

    return {
      type: 'navigational',
      needsAIAnswer: !skipAI,
      confidence: topResult.similarity >= 0.7 ? 'high' : 'medium'
    };
  }

  // CASE 4: General query - use similarity threshold
  const skipAI = topResult.similarity >= AI_GATE.DEFAULT_THRESHOLD;

  return {
    type: 'general',
    needsAIAnswer: !skipAI,
    confidence: topResult.similarity >= 0.75 ? 'high' : 'medium'
  };
}

// ============================================================================
// FORMAT RESULTS (unchanged)
// ============================================================================

function formatSource(memory: RankedMemory): SearchResult {
  return {
    id: memory.id.toString(),
    url: memory.url,
    title: memory.title,
    intent: memory.intent,
    summary: memory.summary,
    visitCount: null,
    createdAt: new Date(memory.created_at),
    similarity: memory.similarity
  };
}

function formatRecallOnlyResponse(memories: RankedMemory[]): AIResponse {
  const sources = memories.slice(0, CONFIG.MAX_RESULTS_TO_USER).map(formatSource);

  return {
    answer: "Here's what I found in your saved articles:",
    sources,
    confidence: 'high',
    usedAI: false
  };
}

function formatWeakMatchResponse(query: string, memories: RankedMemory[]): AIResponse {
  const sources = memories.slice(0, 3).map(formatSource);

  return {
    answer: `I found some loosely related articles, but I'm not very confident they match "${query}". Consider saving more specific content about this topic.`,
    sources,
    confidence: 'low',
    usedAI: false
  };
}

async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function checkInternetConnection(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout('https://www.google.com', 5000);
    return response.ok;
  } catch {
    return false;
  }
}

// ============================================================================
// MAIN SEARCH FUNCTION (REFACTORED)
// ============================================================================

async function semanticSearch(dbPath: string, userId: string, query: string): Promise<AIResponse> {
  let db: Database.Database | null = null;

  try {
    db = new Database(dbPath, { readonly: true });
    let isOnline = await checkInternetConnection();
    if (!isOnline) {
      return {
        answer: 'Please check your internet connection.',
        sources: [],
        confidence: undefined,
        usedAI: false
      };
    }

    // ========================================
    // STEP 1: Generate query embedding
    // ========================================
    const queryEmbedding = await embed(query);

    // ========================================
    // STEP 2: Vector similarity search
    // ========================================
    const ranked = searchSimilarMemories(db, queryEmbedding, userId);

    // ========================================
    // STEP 3: Handle no results
    // ========================================
    if (ranked.length === 0) {
      return {
        answer:
          "I couldn't find any relevant articles. Try saving more content to build your memory!",
        sources: [],
        confidence: 'low',
        usedAI: false
      };
    }

    // ========================================
    // STEP 4: Deduplicate results
    // ========================================
    const deduped = deduplicateResults(ranked);
    const topResult = deduped[0];

    // ========================================
    // STEP 5: Handle weak matches
    // ========================================
    if (topResult.similarity < CONFIG.WEAK_MATCH_THRESHOLD) {
      return formatWeakMatchResponse(query, deduped);
    }

    // ========================================
    // STEP 6: Analyze query intent (NEW!)
    // ========================================
    const intent = analyzeQueryIntent(query, topResult, deduped);

    // ========================================
    // STEP 7: Decide whether to use AI
    // ========================================

    // Check for ambiguous results (multiple close matches)
    const secondResult = deduped[1];
    const dominance = secondResult ? topResult.similarity - secondResult.similarity : 1;
    const hasAmbiguousResults = deduped.length >= 3 && secondResult && dominance < 0.05;

    // Final decision
    const shouldUseAI = intent.needsAIAnswer || hasAmbiguousResults;

    // ========================================
    // STEP 8A: Use AI to generate answer
    // ========================================
    if (shouldUseAI) {
      const aiMemories = deduped.slice(0, AI_GATE.MAX_SOURCES_FOR_AI);
      const { answer, sourceIndices } = await generateAIAnswer(query, aiMemories);

      // If AI didn't cite any sources, fall back to recall-only
      if (sourceIndices.length === 0) {
        return formatRecallOnlyResponse(deduped);
      }

      const sources = sourceIndices.map((index) => formatSource(aiMemories[index]));

      return {
        answer,
        sources,
        confidence: intent.confidence,
        usedAI: true
      };
    }

    // ========================================
    // STEP 8B: Return sources without AI
    // ========================================
    return formatRecallOnlyResponse(deduped);
  } catch (error) {
    console.error('❌ Search error:', error);
    throw error;
  } finally {
    if (db) db.close();
  }
}

// ============================================================================
// HELPER: Get Search Stats (unchanged)
// ============================================================================

export function getSearchStats(
  dbPath: string,
  userId: string
): {
  totalMemories: number;
  avgEmbeddingSize: number;
} {
  const db = new Database(dbPath, { readonly: true });

  try {
    const result = db
      .prepare(
        `
      SELECT
        COUNT(*) as total,
        AVG(LENGTH(embedding)) as avgSize
      FROM memories
      WHERE user_id = ?
    `
      )
      .get(userId) as any;

    return {
      totalMemories: result.total || 0,
      avgEmbeddingSize: result.avgSize || 0
    };
  } finally {
    db.close();
  }
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

function getUserMemorySnapshot(db: Database.Database, userId: string): string {
  const row = db
    .prepare(
      `
      SELECT MAX(created_at) as last_update
      FROM memories
      WHERE user_id = ?
    `
    )
    .get(userId) as any;

  return row?.last_update ?? '1970-01-01';
}

export const semanticSearchWithCache = async (
  dbPath: string,
  userId: string,
  query: string
): Promise<AIResponse> => {
  const db = new Database(dbPath);

  try {
    const normalizedQuery = normalizeQuery(query);
    const memorySnapshot = getUserMemorySnapshot(db, userId);

    // ==================================================
    // 1. CACHE LOOKUP
    // ==================================================
    const cached = db
      .prepare(
        `
        SELECT response_json, memory_snapshot_at
        FROM recent_searches
        WHERE user_id = ?
          AND normalized_query = ?
        LIMIT 1
      `
      )
      .get(userId, normalizedQuery) as any;

    if (cached && cached.memory_snapshot_at === memorySnapshot) {
      return JSON.parse(cached.response_json);
    }

    // ==================================================
    // 2. CACHE MISS → REAL SEARCH
    // ==================================================
    const result = await semanticSearch(dbPath, userId, query);

    // ==================================================
    // 3. STORE RESULT
    // ==================================================
    if (result.confidence !== undefined) {
      db.prepare(
        `
        INSERT OR REPLACE INTO recent_searches (
          user_id,
          normalized_query,
          original_query,
          response_json,
          top_similarity,
          used_ai,
          memory_snapshot_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        userId,
        normalizedQuery,
        query,
        JSON.stringify(result),
        result.sources[0]?.similarity ?? 0,
        result.usedAI ? 1 : 0,
        memorySnapshot
      );
    }

    return result;
  } finally {
    db.close();
  }
};
