import type { ReminderSettings } from '../data/reminder-settings-store';

export type ReminderSyncResult = {
  available: boolean;
  permissionGranted: boolean;
  scheduled: boolean;
  reason?: string;
};

const CATEGORY_ID = 'SPEAK90_REMINDERS';
const SNOOZE_ACTION_ID = 'SNOOZE_30';

let initialized = false;
let listenerAttached = false;

type ExpoNotificationsLike = {
  AndroidImportance?: { HIGH?: number };
  setNotificationHandler: (handler: unknown) => void;
  setNotificationCategoryAsync: (categoryId: string, actions: unknown[]) => Promise<void>;
  setNotificationChannelAsync?: (id: string, channel: unknown) => Promise<void>;
  addNotificationResponseReceivedListener: (listener: (response: any) => void) => { remove: () => void };
  getPermissionsAsync: () => Promise<{ granted: boolean }>;
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  cancelAllScheduledNotificationsAsync: () => Promise<void>;
  scheduleNotificationAsync: (request: unknown) => Promise<string>;
};

function loadNotificationsModule(): ExpoNotificationsLike | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
    return require('expo-notifications') as ExpoNotificationsLike;
  } catch {
    return null;
  }
}

async function scheduleSnooze(Notifications: ExpoNotificationsLike): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Speak90 Reminder',
      body: '30-minute snooze finished. Start your practice now.',
      sound: true,
      categoryIdentifier: CATEGORY_ID,
    },
    trigger: { seconds: 30 * 60 },
  });
}

export async function initializeReminders(): Promise<void> {
  if (initialized) {
    return;
  }

  const Notifications = loadNotificationsModule();
  if (!Notifications) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
    {
      identifier: SNOOZE_ACTION_ID,
      buttonTitle: 'Snooze 30m',
      options: { opensAppToForeground: false },
    },
  ]);

  if (Notifications.setNotificationChannelAsync) {
    await Notifications.setNotificationChannelAsync('daily-reminders', {
      name: 'Daily Reminders',
      importance: Notifications.AndroidImportance?.HIGH ?? 4,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
      sound: 'default',
    });
  }

  if (!listenerAttached) {
    Notifications.addNotificationResponseReceivedListener((response) => {
      if (response?.actionIdentifier === SNOOZE_ACTION_ID) {
        void scheduleSnooze(Notifications);
      }
    });
    listenerAttached = true;
  }

  initialized = true;
}

export async function syncDailyReminder(settings: ReminderSettings): Promise<ReminderSyncResult> {
  const Notifications = loadNotificationsModule();
  if (!Notifications) {
    return {
      available: false,
      permissionGranted: false,
      scheduled: false,
      reason: 'expo-notifications is not installed.',
    };
  }

  await initializeReminders();

  if (!settings.enabled) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return { available: true, permissionGranted: true, scheduled: false };
  }

  const currentPermission = await Notifications.getPermissionsAsync();
  const permission = currentPermission.granted ? currentPermission : await Notifications.requestPermissionsAsync();
  if (!permission.granted) {
    return {
      available: true,
      permissionGranted: false,
      scheduled: false,
      reason: 'Notification permission denied.',
    };
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Speak90 Reminder',
      body: 'Time for your daily speaking session.',
      sound: true,
      categoryIdentifier: settings.snoozeEnabled ? CATEGORY_ID : undefined,
    },
    trigger: {
      hour: settings.hour,
      minute: settings.minute,
      repeats: true,
      channelId: 'daily-reminders',
    },
  });

  return {
    available: true,
    permissionGranted: true,
    scheduled: true,
  };
}
