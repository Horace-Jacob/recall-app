import Database from 'better-sqlite3';
import { ipcMain } from 'electron';
import { deleteMemoryById } from '../memories';

export const registerMemoriesHandler = (dbInstance: Database.Database): void => {
  // Implementation for registering memories handler
  ipcMain.handle('delete-memory', async (_event, id: number) => {
    deleteMemoryById(dbInstance, id);
  });
};
