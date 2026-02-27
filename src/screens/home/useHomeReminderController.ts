import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppSettingsStore } from '../../state/app-settings-store';
import { initializeReminders, syncDailyReminder } from '../../notifications/reminders';
import { buildAnalyticsPayload, trackEvent } from '../../analytics/events';
import { CLOUD_BACKUP_RETENTION_DAYS } from '../../cloud/cloud-backup-config';
import type { ReminderSettings } from '../../data/reminder-settings-store';
import {
  buildReminderPresets,
  buildReminderTimeOptions,
  formatReminderTime,
  normalizeReminderTime,
} from './reminder-settings.service';

type UseHomeReminderControllerParams = {
  currentDay: number;
};

export function useHomeReminderController({ currentDay }: UseHomeReminderControllerParams) {
  const [reminderFeedback, setReminderFeedback] = useState<string | null>(null);
  const [cloudBackupFeedback, setCloudBackupFeedback] = useState<string | null>(null);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [localNow, setLocalNow] = useState(() => new Date());
  const latestReminderOpRef = useRef(0);

  const reminderSettings = useAppSettingsStore((s) => s.reminderSettings);
  const cloudBackupSettings = useAppSettingsStore((s) => s.cloudBackupSettings);
  const hydrateSettings = useAppSettingsStore((s) => s.hydrate);
  const refreshReminderSettings = useAppSettingsStore((s) => s.refreshReminderSettings);
  const saveReminderSettingsAndSync = useAppSettingsStore((s) => s.saveReminderSettingsAndSync);
  const saveCloudBackupSettingsAndSync = useAppSettingsStore((s) => s.saveCloudBackupSettingsAndSync);

  const reminderTimeOptions = useMemo(() => buildReminderTimeOptions(), []);

  const currentLocalTimeLabel = useMemo(() => formatReminderTime(localNow.getHours(), localNow.getMinutes()), [localNow]);
  const reminderPresets = useMemo(() => buildReminderPresets(localNow), [localNow]);

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
    let settingsSaved = false;

    try {
      await saveReminderSettingsAndSync(next);
      settingsSaved = true;
      if (latestReminderOpRef.current !== operationId) {
        return;
      }

      if (options.onSavedMessage) {
        setReminderFeedback(options.onSavedMessage);
      }
      if (!options.shouldSync) {
        return;
      }

      const result = await syncDailyReminder(next);
      if (latestReminderOpRef.current !== operationId) {
        return;
      }
      if (!result.available) {
        setReminderFeedback(result.reason ?? 'Notifications not available on this platform.');
        return;
      }
      if (next.enabled && !result.permissionGranted) {
        const disabled = { ...next, enabled: false };
        await saveReminderSettingsAndSync(disabled);
        if (latestReminderOpRef.current !== operationId) {
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
              hour: next.hour,
              minute: next.minute,
            },
          ),
        );
        return;
      }
      if (next.enabled && options.trackOptIn) {
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
              hour: next.hour,
              minute: next.minute,
              snoozeEnabled: next.snoozeEnabled,
            },
          ),
        );
      }
      setReminderFeedback(next.enabled ? `Daily reminder set for ${formatReminderTime(next.hour, next.minute)}.` : 'Daily reminders turned off.');
    } catch {
      if (latestReminderOpRef.current !== operationId) {
        return;
      }
      if (!settingsSaved) {
        await saveReminderSettingsAndSync(previousSettings);
      }
      setReminderFeedback('Could not update reminders right now. Please try again.');
    }
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
    const next = { enabled: !cloudBackupSettings.enabled };
    try {
      await saveCloudBackupSettingsAndSync(next);
      setCloudBackupFeedback(next.enabled ? `Cloud backup enabled (${CLOUD_BACKUP_RETENTION_DAYS}d retention).` : 'Cloud backup disabled. Future uploads stopped.');
    } catch {
      setCloudBackupFeedback('Could not update cloud backup setting right now.');
    }
  };

  useEffect(() => {
    void hydrateSettings();
  }, [hydrateSettings]);

  useEffect(() => {
    const updateClock = () => {
      setLocalNow(new Date());
    };
    updateClock();
    const intervalId = setInterval(updateClock, 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let active = true;
    const bootstrapGuard = latestReminderOpRef.current;
    const bootstrapReminders = async () => {
      try {
        await initializeReminders();
        const loaded = await refreshReminderSettings();
        if (!active || latestReminderOpRef.current !== bootstrapGuard) {
          return;
        }
        if (loaded.enabled) {
          const result = await syncDailyReminder(loaded);
          if (active && latestReminderOpRef.current === bootstrapGuard && !result.permissionGranted) {
            setReminderFeedback('Reminder permission is required. Enable reminders again after granting permission.');
          }
        }
      } catch {
        if (!active || latestReminderOpRef.current !== bootstrapGuard) {
          return;
        }
        setReminderFeedback('Could not initialize reminders right now.');
      }
    };
    void bootstrapReminders();
    return () => {
      active = false;
    };
  }, [refreshReminderSettings]);

  useEffect(() => {
    if (!reminderFeedback) {
      return;
    }
    const timer = setTimeout(() => {
      setReminderFeedback(null);
    }, 2800);
    return () => clearTimeout(timer);
  }, [reminderFeedback]);

  useEffect(() => {
    if (!cloudBackupFeedback) {
      return;
    }
    const timer = setTimeout(() => {
      setCloudBackupFeedback(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [cloudBackupFeedback]);

  return {
    reminderSettings,
    cloudBackupSettings,
    reminderFeedback,
    cloudBackupFeedback,
    showTimeDropdown,
    setShowTimeDropdown,
    reminderTimeOptions,
    currentLocalTimeLabel,
    reminderPresets,
    formatReminderTime,
    updateReminderTime,
    toggleSnooze,
    disableReminder,
    enableReminder,
    toggleCloudBackup,
  };
}
