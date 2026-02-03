import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { saveToDb } from '../database/savedb';
import { PROFILE_ID } from '../constants';
import { IPCRequest, IPCResponse } from '../types';
import { canonicalizeUrl, findByCanonicalUrl, timeAgo } from '../utils';
import Database from 'better-sqlite3';
import { mainWindow } from '../index';

const sanitizeContentSingleLine = (s: string): string => {
  if (!s) return '';
  // return s.replace(/\s+/g, ' ').trim();
  return s.trim();
};

const processWithReadability = (html: string, url: string): any => {
  try {
    const dom = new JSDOM(html, { url });
    const r = new Readability(dom.window.document);
    const article = r.parse();
    if (!article) return null;
    const text = article.textContent || '';
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.ceil(wordCount / 200);
    return {
      title: article.title,
      byline: article.byline,
      content: text,
      htmlContent: article.content,
      excerpt: article.excerpt,
      wordCount,
      readingTime
    };
  } catch {
    return null;
  }
};

export const processedIncomingWebData = async (
  dbInstance: Database.Database,
  req: IPCRequest
): Promise<IPCResponse | null> => {
  // Process asynchronously
  try {
    let content = req.text || '';
    let title = req.title || '';
    let byline: string | undefined = undefined;
    let excerpt: string | undefined = undefined;
    let wordCount = req.wordCount || 0;
    let readingTime: number | undefined = undefined;

    const canonicalUrl = req.url ? canonicalizeUrl(req.url) : null;

    if (canonicalUrl && !req.selectedOnly) {
      const existing = await findByCanonicalUrl(dbInstance, canonicalUrl, PROFILE_ID);
      if (existing) {
        const ago = timeAgo(existing.created_at);
        return {
          id: req.id,
          ok: false,
          reason: `You saved this ${ago}.`,
          processed: {
            savedId: existing.id
          }
        };
      }
    }

    if (req.html && req.html.length > 0) {
      const processed = processWithReadability(req.html, req.url!);
      if (processed) {
        title = processed.title || title;
        content = processed.content || content;
        byline = processed.byline || undefined;
        excerpt = processed.excerpt || undefined;
        wordCount = processed.wordCount || wordCount;
        readingTime = processed.readingTime;
      }
    }

    // Fallback excerpt
    if (!excerpt) {
      excerpt = (content || '').slice(0, 300);
    }

    // sanitize content to single-line before sending back to native host
    const singleLineContent = sanitizeContentSingleLine(content);
    const singleLineExcerpt = sanitizeContentSingleLine(excerpt);

    const response: IPCResponse = {
      id: req.id,
      ok: true,
      processed: {
        url: req.url,
        canonicalUrl,
        title,
        content: singleLineContent,
        wordCount,
        excerpt: singleLineExcerpt,
        byline: byline || undefined,
        readingTime,
        savedId: ''
      }
    };
    await saveToDb(dbInstance, response!.processed!, 'web', PROFILE_ID);
    if (mainWindow) {
      mainWindow.webContents.send('article-saved');
    }
    return response;
  } catch (err) {
    console.log('Processing error: ' + String(err));
    return null;
  }
};
