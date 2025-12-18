import Database from 'better-sqlite3';
import { ipcMain } from 'electron';
import { QueryDBParams } from '../types';

let dbInstance: Database.Database;

export const initializeDatabase = (dbPath: string): void => {
  if (!dbInstance) {
    dbInstance = new Database(dbPath);
    // You can add any initialization logic here, like creating tables
  }
};

export const getDatabase = (): Database.Database => {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return dbInstance;
};

export const registerDbHandler = (dbInstance: Database.Database): void => {
  ipcMain.handle('db-query', (_event, sql: string, params: QueryDBParams[]) => {
    try {
      const stmt = dbInstance.prepare(sql);
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        return stmt.all(...params);
      } else {
        const info = stmt.run(...params);
        return info;
      }
    } catch (err) {
      console.log(err);
      throw err;
    }
  });
};
