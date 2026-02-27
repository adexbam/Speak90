import { useRef } from 'react';
import type { ReminderSettings } from '../../data/reminder-settings-store';
import { CLOUD_BACKUP_RETENTION_DAYS } from '../../cloud/cloud-backup-config';
import { applyReminderSettingsWithSync } from './reminder-sync.service';
import { formatReminderTime, normalizeReminderTime } from './reminder-settings.service';

type UseReminderSettingsActionsParams = {
  currentDay: number;
  reminderSettings: ReminderSettings;
  cloudBackupEnabled: boolean;
  saveReminderSettingsAndSync: (next: ReminderSettings) => Promise<void>;
  saveCloudBackupSettingsAndSync: (next: { enabled: boolean }) => Promise<void>;
  setReminderFeedback: (value: string | null) => void;
  setCloudBackupFeedback: (value: string | null) => void;
  setShowTimeDropdown: (value: boolean) => void;
};

export function useReminderSettingsActions({
  currentDay,
  reminderSettings,
  cloudBackupEnabled,
  saveReminderSettingsAndSync,
  saveCloudBackupSettingsAndSync,
  setReminderFeedback,
  setCloudBackupFeedback,
  setShowTimeDropdown,
}: UseReminderSettingsActionsParams) {
  const latestReminderOpRef = useRef(0);

  const applyReminderSettings = async (
    next: ReminderSettings,
    options: {
      shouldSync: boolean;
      trackOptIn?: boolean;
      onSavedMessage?: string;
    },
  ) => {
    const operationId = latestReminderOpRef.current + 1;
    latestReminderOpRef.current = operationId;
    const previousSettings = reminderSettings;
    await applyReminderSettingsWithSync({
      currentDay,
      operationId,
      latestOperationRef: latestReminderOpRef,
      previousSettings,
      nextSettings: next,
      options,
      saveReminderSettingsAndSync,
      setReminderFeedback,
      formatReminderTime,
    });
  };

  const updateReminderTime = (nextHour: number, nextMinute: number) => {
    const normalized = normalizeReminderTime(nextHour, nextMinute);
    void applyReminderSettings(
      {
        ...reminderSettings,
        hour: normalized.hour,
        minute: normalized.minute,
      },
      {
        shouldSync: reminderSettings.enabled,
        onSavedMessage: reminderSettings.enabled ? undefined : `Reminder time saved: ${formatReminderTime(normalized.hour, normalized.minute)}.`,
      },
    );
    setShowTimeDropdown(false);
  };

  const toggleSnooze = () => {
    const nextSnoozeEnabled = !reminderSettings.snoozeEnabled;
    void applyReminderSettings(
      {
        ...reminderSettings,
        snoozeEnabled: nextSnoozeEnabled,
      },
      {
        shouldSync: reminderSettings.enabled,
        onSavedMessage: reminderSettings.enabled ? undefined : `Snooze is now ${nextSnoozeEnabled ? 'On' : 'Off'}.`,
      },
    );
  };

  const disableReminder = () =>
    applyReminderSettings(
      { ...reminderSettings, enabled: false },
      {
        shouldSync: true,
      },
    );

  const enableReminder = () =>
    applyReminderSettings(
      { ...reminderSettings, enabled: true },
      {
        shouldSync: true,
        trackOptIn: true,
      },
    );

  const toggleCloudBackup = async () => {
    const next = { enabled: !cloudBackupEnabled };
    try {
      await saveCloudBackupSettingsAndSync(next);
      setCloudBackupFeedback(next.enabled ? `Cloud backup enabled (${CLOUD_BACKUP_RETENTION_DAYS}d retention).` : 'Cloud backup disabled. Future uploads stopped.');
    } catch {
      setCloudBackupFeedback('Could not update cloud backup setting right now.');
    }
  };

  return {
    latestReminderOpRef,
    updateReminderTime,
    toggleSnooze,
    disableReminder,
    enableReminder,
    toggleCloudBackup,
  };
}
