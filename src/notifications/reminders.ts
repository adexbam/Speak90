import type { ReminderSettings } from '../data/reminder-settings-store';

export type ReminderSyncResult = {
  available: boolean;
  permissionGranted: boolean;
  scheduled: boolean;
  reason?: string;
};

export async function initializeReminders(): Promise<void> {
  // Web fallback: no-op.
}

export async function syncDailyReminder(_settings: ReminderSettings): Promise<ReminderSyncResult> {
  return {
    available: false,
    permissionGranted: false,
    scheduled: false,
    reason: 'Notifications are not available on this platform.',
  };
}
