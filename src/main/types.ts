export interface LocalSetting {
  localProfileId: string | null;
  onboardingCompleted: number;
  lastImportAt: string | null;
  skipOnboarding: number;
}

export interface IPCRequest {
  id: string;
  url?: string;
  title?: string;
  text?: string;
  html?: string;
  wordCount?: number;
  selectedOnly?: boolean;
}

// Outgoing message shape back to extension
export interface IPCResponse {
  id: string;
  ok: boolean;
  reason?: string;
  processed?: Processed;
}

export interface Processed {
  url?: string;
  canonicalUrl?: string | null;
  title?: string;
  content?: string;
  intent?: string | null;
  wordCount?: number;
  excerpt?: string;
  byline?: string;
  readingTime?: number;
  savedId?: string;
}

export type QueryDBParams = string | number | boolean | null;

export interface BrowserHistoryEntry {
  url: string;
  title: string;
  visitTime: Date;
  visitCount: number;
  typedCount?: number;
  lastVisitTime?: Date;
}

export interface BrowserInfo {
  name: 'chrome' | 'firefox' | 'edge' | 'safari' | 'brave' | 'opera' | 'unknown';
  profilePath: string;
  historyDbPath: string;
}

export interface HistoryRetrievalResult {
  success: boolean;
  entries: BrowserHistoryEntry[];
  browser: BrowserInfo;
  error?: string;
  totalEntries: number;
  dateRange: {
    from: Date;
    to: Date;
  };
}

export interface ProcessedHistoryEntry {
  url: string;
  title: string;
  content: string;
  contentLength: number;
  wordCount: number;
  visitCount: number;
  visitTime: Date;
}

export interface ProcessingProgress {
  stage: 'filtering' | 'ai-selection' | 'fetching' | 'complete' | 'error';
  message: string;
  progress: number; // 0-100
  currentUrl?: string;
  stats?: Partial<ProcessingResult['stats']>;
}

export interface ProcessingResult {
  success: boolean;
  processedEntries: ProcessedHistoryEntry[];
  stats: {
    totalInput: number;
    afterBlocklist: number;
    sentToAI: number;
    aiSelected: number;
    successfullyFetched: number;
    finalCount: number;
  };
  message?: string;
  error?: string;
}

export interface Memory {
  id: number;
  url: string;
  title: string;
  content: string;
  intent: string | null;
  summary: string;
  embedding: Buffer;
  created_at: string;
  source_type: string | null;
}

export interface SearchResult {
  id: string;
  url: string;
  title: string;
  summary: string;
  intent: string | null;
  visitCount: number | null;
  createdAt: Date;
  similarity: number;
}

export interface AIResponse {
  answer: string;
  sources: SearchResult[];
  confidence?: 'high' | 'medium' | 'low';
  usedAI?: boolean;
}

export interface RankedMemory extends Memory {
  similarity: number;
  recencyScore: number;
  finalScore: number;
}
