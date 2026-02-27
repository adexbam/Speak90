import type { ReminderSettings } from '../data/reminder-settings-store';
import {
  cancelSpeak90ReminderNotifications,
  initializeRemindersRuntime,
  loadNotificationsModule,
  scheduleDailyReminder,
} from './reminder-notifications.runtime.native';

export type ReminderSyncResult = {
  available: boolean;
  permissionGranted: boolean;
  scheduled: boolean;
  reason?: string;
};

export async function initializeReminders(): Promise<void> {
  const Notifications = loadNotificationsModule();
  if (!Notifications) {
    return;
  }
  await initializeRemindersRuntime(Notifications);
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

  await initializeRemindersRuntime(Notifications);

  if (!settings.enabled) {
    await cancelSpeak90ReminderNotifications(Notifications);
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

  await cancelSpeak90ReminderNotifications(Notifications);
  await scheduleDailyReminder(Notifications, settings);

  return {
    available: true,
    permissionGranted: true,
    scheduled: true,
  };
}
