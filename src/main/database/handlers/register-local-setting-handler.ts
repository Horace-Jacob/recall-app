import Database from 'better-sqlite3';
import {
  getLocalSettings,
  resetLocalSetting,
  skipOnboarding,
  updateLocalProfileId,
  updateLocalSettings
} from '../local-settings';
import { ipcMain } from 'electron';
import { LocalSetting } from '../../types';

export const registerLocalSettingHandler = (dbInstance: Database.Database): void => {
  // Implementation for registering local setting handler
  ipcMain.handle('get-local-setting', async () => {
    return getLocalSettings(dbInstance);
  });

  ipcMain.handle('update-local-setting', async (_event, settings: Partial<LocalSetting>) => {
    updateLocalSettings(dbInstance, settings);
  });

  ipcMain.handle('update-local-profile-id', async (_event, userId: string) => {
    updateLocalProfileId(dbInstance, userId);
  });

  ipcMain.handle('reset-local-setting', async () => {
    resetLocalSetting(dbInstance);
  });

  ipcMain.handle('skip-onboarding', async () => {
    skipOnboarding(dbInstance);
  });
};
