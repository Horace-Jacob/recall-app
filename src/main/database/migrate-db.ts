import Database from 'better-sqlite3';

function columnExists(db: Database.Database, table: string, column: string): boolean {
  const columns = db.prepare(`PRAGMA table_info(${table});`).all();

  return columns.some((c: any) => c.name === column);
}

export function migrateMemoriesTable(db: Database.Database) {
  if (!columnExists(db, 'memories', 'content_type')) {
    db.prepare(
      `
      ALTER TABLE memories ADD COLUMN content_type TEXT DEFAULT NULL;
    `
    ).run();
  }

  if (!columnExists(db, 'memories', 'save_type')) {
    db.prepare(
      `
      ALTER TABLE memories ADD COLUMN save_type TEXT DEFAULT 'auto';
    `
    ).run();
  }
}
