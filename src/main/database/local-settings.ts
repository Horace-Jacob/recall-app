import Database from 'better-sqlite3';
import { LocalSetting } from '../types';

export const createLocalSettingsTable = (dbInstance: Database.Database): void => {
  dbInstance
    .prepare(
      `CREATE TABLE IF NOT EXISTS local_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      local_profile_id TEXT,
      onboarding_completed INTEGER DEFAULT 0,
      skip_onboarding INTEGER DEFAULT 0,
      last_import_at TEXT
    );`
    )
    .run();

  dbInstance
    .prepare(
      `
      INSERT INTO local_settings (id)
      VALUES (1)
      ON CONFLICT(id) DO NOTHING;
    `
    )
    .run();
};

export const getLocalSettings = (dbInstance: Database.Database): LocalSetting => {
  const row: any = dbInstance.prepare(`SELECT * FROM local_settings WHERE id = 1`).get();

  return {
    localProfileId: row.local_profile_id,
    onboardingCompleted: row.onboarding_completed,
    lastImportAt: row.last_import_at,
    skipOnboarding: row.skip_onboarding
  };
};

export const updateLocalSettings = (
  dbInstance: Database.Database,
  settings: Partial<LocalSetting>
): void => {
  const current = getLocalSettings(dbInstance);
  const merged = {
    localProfileId: settings.localProfileId ?? current.localProfileId,
    onboardingCompleted: settings.onboardingCompleted ?? current.onboardingCompleted,
    skipOnboarding: settings.skipOnboarding ?? current.skipOnboarding,
    lastImportAt: settings.lastImportAt ?? current.lastImportAt
  };

  dbInstance
    .prepare(
      `
      UPDATE local_settings
      SET
        local_profile_id = ?,
        onboarding_completed = ?,
        skip_onboarding = ?,
        last_import_at = ?
      WHERE id = 1
    `
    )
    .run(
      merged.localProfileId,
      merged.onboardingCompleted,
      merged.skipOnboarding,
      merged.lastImportAt
    );
};

export const updateLocalProfileId = (dbInstance: Database.Database, userId: string): void => {
  dbInstance
    .prepare(
      `
        UPDATE local_settings
        SET local_profile_id = ?
        WHERE id = 1
      `
    )
    .run(userId);
};

export const skipOnboarding = (dbInstance: Database.Database): void => {
  dbInstance
    .prepare(
      `
        UPDATE local_settings
        SET skip_onboarding = 1
        WHERE id = 1
      `
    )
    .run();
};

export const resetLocalSetting = (dbInstance: Database.Database): void => {
  dbInstance
    .prepare(
      `
        UPDATE local_settings
        SET local_profile_id = NULL,
            onboarding_completed = 0,
            last_import_at = NULL
        WHERE id = 1
      `
    )
    .run();
};
