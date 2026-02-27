import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppSettingsStore } from './app-settings-store';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

describe('app-settings-store integration', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useAppSettingsStore.setState({
      reminderSettings: {
        enabled: false,
        hour: 19,
        minute: 0,
        snoozeEnabled: true,
      },
      cloudBackupSettings: { enabled: false },
      languagePreferences: {
        baseLanguage: 'en',
        targetLanguage: 'de',
        isOnboardingComplete: false,
      },
      isHydrating: false,
      hydratedOnce: false,
    });
  });

  it('serializes reminder writes and keeps last write', async () => {
    await Promise.all([
      useAppSettingsStore.getState().saveReminderSettingsAndSync({
        enabled: true,
        hour: 8,
        minute: 0,
        snoozeEnabled: true,
      }),
      useAppSettingsStore.getState().saveReminderSettingsAndSync({
        enabled: true,
        hour: 21,
        minute: 30,
        snoozeEnabled: false,
      }),
    ]);

    const settings = useAppSettingsStore.getState().reminderSettings;
    expect(settings.enabled).toBe(true);
    expect(settings.hour).toBe(21);
    expect(settings.minute).toBe(30);
    expect(settings.snoozeEnabled).toBe(false);
  });
});

