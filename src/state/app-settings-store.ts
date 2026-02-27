import { create } from 'zustand';
import {
  DEFAULT_REMINDER_SETTINGS,
  loadReminderSettings,
  saveReminderSettings,
  type ReminderSettings,
} from '../data/reminder-settings-store';
import {
  DEFAULT_CLOUD_BACKUP_SETTINGS,
  loadCloudBackupSettings,
  saveCloudBackupSettings,
  type CloudBackupSettings,
} from '../data/cloud-backup-store';
import {
  DEFAULT_LANGUAGE_PREFERENCES,
  loadLanguagePreferences,
  saveLanguagePreferences,
  type LanguagePreferences,
} from '../data/language-preferences-store';

type AppSettingsState = {
  reminderSettings: ReminderSettings;
  cloudBackupSettings: CloudBackupSettings;
  languagePreferences: LanguagePreferences;
  isHydrating: boolean;
  hydratedOnce: boolean;
  hydrate: () => Promise<{
    reminderSettings: ReminderSettings;
    cloudBackupSettings: CloudBackupSettings;
    languagePreferences: LanguagePreferences;
  }>;
  refreshReminderSettings: () => Promise<ReminderSettings>;
  saveReminderSettingsAndSync: (settings: ReminderSettings) => Promise<void>;
  refreshCloudBackupSettings: () => Promise<CloudBackupSettings>;
  saveCloudBackupSettingsAndSync: (settings: CloudBackupSettings) => Promise<void>;
  refreshLanguagePreferences: () => Promise<LanguagePreferences>;
  saveLanguagePreferencesAndSync: (preferences: LanguagePreferences) => Promise<void>;
};

let reminderWriteQueue: Promise<unknown> = Promise.resolve();
let cloudBackupWriteQueue: Promise<unknown> = Promise.resolve();
let languageWriteQueue: Promise<unknown> = Promise.resolve();

export const useAppSettingsStore = create<AppSettingsState>((set) => ({
  reminderSettings: DEFAULT_REMINDER_SETTINGS,
  cloudBackupSettings: DEFAULT_CLOUD_BACKUP_SETTINGS,
  languagePreferences: DEFAULT_LANGUAGE_PREFERENCES,
  isHydrating: false,
  hydratedOnce: false,
  hydrate: async () => {
    set({ isHydrating: true });
    try {
      const [reminderSettings, cloudBackupSettings, languagePreferences] = await Promise.all([
        loadReminderSettings(),
        loadCloudBackupSettings(),
        loadLanguagePreferences(),
      ]);
      set({
        reminderSettings,
        cloudBackupSettings,
        languagePreferences,
        hydratedOnce: true,
      });
      return { reminderSettings, cloudBackupSettings, languagePreferences };
    } finally {
      set({ isHydrating: false });
    }
  },
  refreshReminderSettings: async () => {
    const reminderSettings = await loadReminderSettings();
    set({ reminderSettings });
    return reminderSettings;
  },
  saveReminderSettingsAndSync: async (settings) => {
    const run = reminderWriteQueue.then(async () => {
      await saveReminderSettings(settings);
      set({ reminderSettings: settings });
    });
    reminderWriteQueue = run.catch(() => undefined);
    await run;
  },
  refreshCloudBackupSettings: async () => {
    const cloudBackupSettings = await loadCloudBackupSettings();
    set({ cloudBackupSettings });
    return cloudBackupSettings;
  },
  saveCloudBackupSettingsAndSync: async (settings) => {
    const run = cloudBackupWriteQueue.then(async () => {
      await saveCloudBackupSettings(settings);
      set({ cloudBackupSettings: settings });
    });
    cloudBackupWriteQueue = run.catch(() => undefined);
    await run;
  },
  refreshLanguagePreferences: async () => {
    const languagePreferences = await loadLanguagePreferences();
    set({ languagePreferences });
    return languagePreferences;
  },
  saveLanguagePreferencesAndSync: async (preferences) => {
    const run = languageWriteQueue.then(async () => {
      await saveLanguagePreferences(preferences);
      set({ languagePreferences: preferences });
    });
    languageWriteQueue = run.catch(() => undefined);
    await run;
  },
}));
