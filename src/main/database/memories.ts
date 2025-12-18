import Database from 'better-sqlite3';

export const createMemoriesTable = (dbInstance: Database.Database): void => {
  dbInstance
    .prepare(
      `
        CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        url TEXT,
        canonical_url TEXT,
        title TEXT,
        content TEXT DEFAULT NULL,
        summary TEXT,
        embedding BLOB DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        source_type TEXT DEFAULT NULL
      );
        `
    )
    .run();
  dbInstance
    .prepare(
      `
              CREATE UNIQUE INDEX IF NOT EXISTS idx_memories_user_canonical_url
        ON memories (user_id, canonical_url);`
    )
    .run();
  dbInstance
    .prepare(
      `
      CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at DESC);
      `
    )
    .run();
  dbInstance
    .prepare(
      `
      CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
       `
    )
    .run();
};

export const deleteMemoryById = (dbInstance: Database.Database, id: number): void => {
  dbInstance.prepare('DELETE FROM memories WHERE id = ?;').run(id);
};
