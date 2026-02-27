import { buildAnalyticsPayload, trackEvent } from '../../analytics/events';
import { syncDailyReminder } from '../../notifications/reminders';
import type { ReminderSettings } from '../../data/reminder-settings-store';

type ReminderApplyOptions = {
  shouldSync: boolean;
  trackOptIn?: boolean;
  onSavedMessage?: string;
};

type ReminderApplyDeps = {
  currentDay: number;
  operationId: number;
  latestOperationRef: { current: number };
  previousSettings: ReminderSettings;
  nextSettings: ReminderSettings;
  options: ReminderApplyOptions;
  saveReminderSettingsAndSync: (settings: ReminderSettings) => Promise<void>;
  setReminderFeedback: (message: string) => void;
  formatReminderTime: (hour: number, minute: number) => string;
};

function isStaleOperation(operationId: number, latestOperationRef: { current: number }) {
  return latestOperationRef.current !== operationId;
}

export async function applyReminderSettingsWithSync({
  currentDay,
  operationId,
  latestOperationRef,
  previousSettings,
  nextSettings,
  options,
  saveReminderSettingsAndSync,
  setReminderFeedback,
  formatReminderTime,
}: ReminderApplyDeps): Promise<void> {
  let settingsSaved = false;

  try {
    await saveReminderSettingsAndSync(nextSettings);
    settingsSaved = true;
    if (isStaleOperation(operationId, latestOperationRef)) {
      return;
    }

    if (options.onSavedMessage) {
      setReminderFeedback(options.onSavedMessage);
    }
    if (!options.shouldSync) {
      return;
    }

    const result = await syncDailyReminder(nextSettings);
    if (isStaleOperation(operationId, latestOperationRef)) {
      return;
    }

    if (!result.available) {
      setReminderFeedback(result.reason ?? 'Notifications not available on this platform.');
      return;
    }

    if (nextSettings.enabled && !result.permissionGranted) {
      const disabled = { ...nextSettings, enabled: false };
      await saveReminderSettingsAndSync(disabled);
      if (isStaleOperation(operationId, latestOperationRef)) {
        return;
      }
      setReminderFeedback('Reminder permission denied. Reminders remain disabled.');
      trackEvent(
        'notification_opt_in',
        buildAnalyticsPayload(
          {
            dayNumber: currentDay,
            sectionId: 'system.notifications',
          },
          {
            enabled: false,
            status: 'denied',
            hour: nextSettings.hour,
            minute: nextSettings.minute,
          },
        ),
      );
      return;
    }

    if (nextSettings.enabled && options.trackOptIn) {
      trackEvent(
        'notification_opt_in',
        buildAnalyticsPayload(
          {
            dayNumber: currentDay,
            sectionId: 'system.notifications',
          },
          {
            enabled: true,
            status: 'granted',
            hour: nextSettings.hour,
            minute: nextSettings.minute,
            snoozeEnabled: nextSettings.snoozeEnabled,
          },
        ),
      );
    }

    setReminderFeedback(
      nextSettings.enabled
        ? `Daily reminder set for ${formatReminderTime(nextSettings.hour, nextSettings.minute)}.`
        : 'Daily reminders turned off.',
    );
  } catch {
    if (isStaleOperation(operationId, latestOperationRef)) {
      return;
    }
    if (!settingsSaved) {
      await saveReminderSettingsAndSync(previousSettings);
    }
    setReminderFeedback('Could not update reminders right now. Please try again.');
  }
}

