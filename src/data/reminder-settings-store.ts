import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDER_SETTINGS_KEY = 'speak90:reminder-settings:v1';

export interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
  snoozeEnabled: boolean;
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  hour: 19,
  minute: 0,
  snoozeEnabled: true,
};

function sanitizeReminderSettings(value: unknown): ReminderSettings {
  if (typeof value !== 'object' || value === null) {
    return DEFAULT_REMINDER_SETTINGS;
  }

  const parsed = value as Partial<ReminderSettings>;
  const hour = Number.isInteger(parsed.hour) && (parsed.hour ?? -1) >= 0 && (parsed.hour ?? 24) <= 23 ? parsed.hour : 19;
  const minute =
    Number.isInteger(parsed.minute) && (parsed.minute ?? -1) >= 0 && (parsed.minute ?? 60) <= 59 ? parsed.minute : 0;

  return {
    enabled: !!parsed.enabled,
    hour: hour as number,
    minute: minute as number,
    snoozeEnabled: parsed.snoozeEnabled ?? true,
  };
}

export async function loadReminderSettings(): Promise<ReminderSettings> {
  const raw = await AsyncStorage.getItem(REMINDER_SETTINGS_KEY);
  if (!raw) {
    return DEFAULT_REMINDER_SETTINGS;
  }
  try {
    return sanitizeReminderSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_REMINDER_SETTINGS;
  }
}

export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  await AsyncStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(sanitizeReminderSettings(settings)));
}
