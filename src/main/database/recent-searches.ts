import Database from 'better-sqlite3';

export const createRecentSearchesTable = (dbInstance: Database.Database): void => {
  dbInstance
    .prepare(
      `
    CREATE TABLE IF NOT EXISTS recent_searches (
      user_id TEXT NOT NULL,
      normalized_query TEXT NOT NULL,
      original_query TEXT NOT NULL,

      response_json TEXT NOT NULL,
      top_similarity REAL NOT NULL,
      used_ai INTEGER NOT NULL,

      memory_snapshot_at DATETIME NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

      PRIMARY KEY (user_id, normalized_query)
    );

    `
    )
    .run();
  dbInstance
    .prepare(
      `
    CREATE INDEX IF NOT EXISTS idx_recent_searches_user
      ON recent_searches(user_id, created_at DESC);
    `
    )
    .run();
};
