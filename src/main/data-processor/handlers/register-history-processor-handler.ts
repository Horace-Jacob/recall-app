import Database from 'better-sqlite3';
import { getBrowserHistoryWithPermission } from '../../services/browser-history-service';
import { processHistoryForOnboardingWithProgress } from '../history-processor';
import { ipcMain } from 'electron';

export const registerHistoryProcessorHandler = (dbInstance: Database.Database): void => {
  ipcMain.handle('get-browser-history', async (_event, days: number) => {
    return await getBrowserHistoryWithPermission(days);
  });

  ipcMain.on('browser:startProcessingHistory', async (event, userId, entries) => {
    try {
      const result = await processHistoryForOnboardingWithProgress(
        dbInstance,
        userId,
        entries,
        (progress) => {
          // Send progress updates (non-blocking)
          event.sender.send('browser:processingProgress', progress);
        }
      );

      // Send completion event
      event.sender.send('browser:processingComplete', result);
    } catch (error) {
      // Send error event
      event.sender.send('browser:processingError', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
};
