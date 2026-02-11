import Database from 'better-sqlite3';
import { Processed } from '../types';
import { cleanContent, trimForProcessing } from '../utils';
import { classifyContent, embed, summarize } from '../data-processor/ai-processor';

export const saveToDb = async (
  dbInstance: Database.Database,
  data: Processed,
  sourceType: string,
  userId: string
): Promise<void> => {
  try {
    let embeddingBuf: any;
    const cleaned = cleanContent(data.content!);
    const trimmed = trimForProcessing(cleaned);
    const contentType = await classifyContent(trimmed);
    const summary = await summarize(data.title, trimmed, contentType);
    const embedding = await embed(summary);
    if (embedding) {
      const arr = new Float32Array(embedding);
      embeddingBuf = Buffer.from(arr.buffer);
    }
    const current_time = Date.now();
    dbInstance
      .prepare(
        `INSERT INTO memories (user_id, url, canonical_url, title, summary, intent, content_type, save_type, embedding, content, created_at, source_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        userId,
        data.url!,
        data.canonicalUrl,
        data.title!,
        summary,
        data.intent || null,
        contentType || null,
        data.selectedOnly ? 'selection' : 'auto',
        embeddingBuf,
        data.content!,
        current_time,
        sourceType
      );
  } catch (error) {
    throw new Error((error as Error).message);
  }
};
