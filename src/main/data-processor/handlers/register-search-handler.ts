import { app, ipcMain } from 'electron';
import { getSearchStats, semanticSearchWithCache } from '../semantic-search';
import Database from 'better-sqlite3';
import path from 'path';

export function registerSearchHandlers(): void {
  // Semantic search
  ipcMain.handle('search:semanticSearch', async (_event, userId: string, query: string) => {
    try {
      const result = await semanticSearchWithCache(
        path.join(app.getPath('userData'), 'memory-layer.db'),
        userId,
        query
      );
      return { success: true, data: result };
    } catch (error) {
      console.error('Semantic search error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  ipcMain.handle('search:getRecentSearches', async (_event, userId: string) => {
    try {
      const db = new Database(path.join(app.getPath('userData'), 'memory-layer.db'), {
        readonly: true
      });

      const searches = db
        .prepare(
          `
          SELECT original_query as query, created_at as date
          FROM recent_searches
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT 5
        `
        )
        .all(userId);

      db.close();

      return { success: true, data: searches };
    } catch (error) {
      console.error('Get recent searches error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Get search stats
  ipcMain.handle('search:getStats', async (_event, userId: string) => {
    try {
      const stats = getSearchStats(path.join(app.getPath('userData'), 'memory-layer.db'), userId);
      return { success: true, data: stats };
    } catch (error) {
      console.error('Get stats error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });
}
