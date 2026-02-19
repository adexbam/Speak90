import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_REMINDER_SETTINGS, loadReminderSettings, saveReminderSettings } from './reminder-settings-store';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('reminder-settings-store', () => {
  let state: Record<string, string>;

  beforeEach(() => {
    jest.clearAllMocks();
    state = {};
    storage.getItem.mockImplementation(async (key: string) => state[key] ?? null);
    storage.setItem.mockImplementation(async (key: string, value: string) => {
      state[key] = value;
    });
  });

  it('returns defaults when storage is empty', async () => {
    await expect(loadReminderSettings()).resolves.toEqual(DEFAULT_REMINDER_SETTINGS);
  });

  it('saves and loads sanitized settings', async () => {
    await saveReminderSettings({
      enabled: true,
      hour: 21,
      minute: 15,
      snoozeEnabled: false,
    });
    await expect(loadReminderSettings()).resolves.toEqual({
      enabled: true,
      hour: 21,
      minute: 15,
      snoozeEnabled: false,
    });
  });
});
