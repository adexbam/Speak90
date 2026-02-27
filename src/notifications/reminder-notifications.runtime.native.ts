import type { ReminderSettings } from '../data/reminder-settings-store';

export type ExpoNotificationsLike = {
  AndroidImportance?: { HIGH?: number };
  setNotificationHandler: (handler: unknown) => void;
  setNotificationCategoryAsync: (categoryId: string, actions: unknown[]) => Promise<void>;
  setNotificationChannelAsync?: (id: string, channel: unknown) => Promise<void>;
  addNotificationResponseReceivedListener: (listener: (response: any) => void) => { remove: () => void };
  getPermissionsAsync: () => Promise<{ granted: boolean }>;
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  getAllScheduledNotificationsAsync?: () => Promise<Array<{ identifier: string; content?: { title?: string; categoryIdentifier?: string; data?: { source?: string } } }>>;
  cancelScheduledNotificationAsync?: (identifier: string) => Promise<void>;
  cancelAllScheduledNotificationsAsync?: () => Promise<void>;
  scheduleNotificationAsync: (request: unknown) => Promise<string>;
};

export const reminderConstants = {
  categoryId: 'SPEAK90_REMINDERS',
  snoozeActionId: 'SNOOZE_30',
  reminderSource: 'speak90-reminder',
  reminderTitle: 'Speak90 Reminder',
  reminderBody: 'Time for your daily speaking session.',
  snoozeBody: '30-minute snooze finished. Start your practice now.',
  channelId: 'daily-reminders',
};

let initialized = false;
let listenerAttached = false;

export function loadNotificationsModule(): ExpoNotificationsLike | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
    return require('expo-notifications') as ExpoNotificationsLike;
  } catch {
    return null;
  }
}

export async function scheduleSnooze(Notifications: ExpoNotificationsLike): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: reminderConstants.reminderTitle,
      body: reminderConstants.snoozeBody,
      sound: true,
      categoryIdentifier: reminderConstants.categoryId,
      data: { source: reminderConstants.reminderSource },
    },
    trigger: { seconds: 30 * 60 },
  });
}

export async function cancelSpeak90ReminderNotifications(Notifications: ExpoNotificationsLike): Promise<void> {
  const getAllScheduledNotificationsAsync = Notifications.getAllScheduledNotificationsAsync;
  const cancelScheduledNotificationAsync = Notifications.cancelScheduledNotificationAsync;
  if (!getAllScheduledNotificationsAsync || !cancelScheduledNotificationAsync) {
    if (Notifications.cancelAllScheduledNotificationsAsync) {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
    return;
  }

  const scheduled = await getAllScheduledNotificationsAsync();
  const reminderIds = scheduled
    .filter((item) => item.content?.data?.source === reminderConstants.reminderSource)
    .map((item) => item.identifier);

  await Promise.all(reminderIds.map((id) => cancelScheduledNotificationAsync(id)));
}

export async function initializeRemindersRuntime(Notifications: ExpoNotificationsLike): Promise<void> {
  if (initialized) {
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

  await Notifications.setNotificationCategoryAsync(reminderConstants.categoryId, [
    {
      identifier: reminderConstants.snoozeActionId,
      buttonTitle: 'Snooze 30m',
      options: { opensAppToForeground: false },
    },
  ]);

  if (Notifications.setNotificationChannelAsync) {
    await Notifications.setNotificationChannelAsync(reminderConstants.channelId, {
      name: 'Daily Reminders',
      importance: Notifications.AndroidImportance?.HIGH ?? 4,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
      sound: 'default',
    });
  }

  if (!listenerAttached) {
    Notifications.addNotificationResponseReceivedListener((response) => {
      if (response?.actionIdentifier === reminderConstants.snoozeActionId) {
        void scheduleSnooze(Notifications);
      }
    });
    listenerAttached = true;
  }

  initialized = true;
}

export async function scheduleDailyReminder(Notifications: ExpoNotificationsLike, settings: ReminderSettings): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: reminderConstants.reminderTitle,
      body: reminderConstants.reminderBody,
      sound: true,
      categoryIdentifier: settings.snoozeEnabled ? reminderConstants.categoryId : undefined,
      data: { source: reminderConstants.reminderSource },
    },
    trigger: {
      hour: settings.hour,
      minute: settings.minute,
      repeats: true,
      channelId: reminderConstants.channelId,
    },
  });
}
