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
  hydrate: () => Promise<void>;
  refreshReminderSettings: () => Promise<void>;
  saveReminderSettingsAndSync: (settings: ReminderSettings) => Promise<void>;
  refreshCloudBackupSettings: () => Promise<void>;
  saveCloudBackupSettingsAndSync: (settings: CloudBackupSettings) => Promise<void>;
  refreshLanguagePreferences: () => Promise<void>;
  saveLanguagePreferencesAndSync: (preferences: LanguagePreferences) => Promise<void>;
};

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
    } finally {
      set({ isHydrating: false });
    }
  },
  refreshReminderSettings: async () => {
    const reminderSettings = await loadReminderSettings();
    set({ reminderSettings });
  },
  saveReminderSettingsAndSync: async (settings) => {
    await saveReminderSettings(settings);
    set({ reminderSettings: settings });
  },
  refreshCloudBackupSettings: async () => {
    const cloudBackupSettings = await loadCloudBackupSettings();
    set({ cloudBackupSettings });
  },
  saveCloudBackupSettingsAndSync: async (settings) => {
    await saveCloudBackupSettings(settings);
    set({ cloudBackupSettings: settings });
  },
  refreshLanguagePreferences: async () => {
    const languagePreferences = await loadLanguagePreferences();
    set({ languagePreferences });
  },
  saveLanguagePreferencesAndSync: async (preferences) => {
    await saveLanguagePreferences(preferences);
    set({ languagePreferences: preferences });
  },
}));

