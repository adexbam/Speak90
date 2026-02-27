import { useEffect } from 'react';
import { initializeReminders, syncDailyReminder } from '../../notifications/reminders';
import type { ReminderSettings } from '../../data/reminder-settings-store';

type UseReminderLifecycleParams = {
  latestReminderOpRef: { current: number };
  refreshReminderSettings: () => Promise<ReminderSettings>;
  setReminderFeedback: (value: string | null) => void;
  setCloudBackupFeedback: (value: string | null) => void;
  setLocalNow: (value: Date) => void;
  reminderFeedback: string | null;
  cloudBackupFeedback: string | null;
};

export function useReminderLifecycle({
  latestReminderOpRef,
  refreshReminderSettings,
  setReminderFeedback,
  setCloudBackupFeedback,
  setLocalNow,
  reminderFeedback,
  cloudBackupFeedback,
}: UseReminderLifecycleParams) {
  useEffect(() => {
    const updateClock = () => {
      setLocalNow(new Date());
    };
    updateClock();
    const intervalId = setInterval(updateClock, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [setLocalNow]);

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
  }, [latestReminderOpRef, refreshReminderSettings, setReminderFeedback]);

  useEffect(() => {
    if (!reminderFeedback) {
      return;
    }
    const timer = setTimeout(() => {
      setReminderFeedback(null);
    }, 2800);
    return () => clearTimeout(timer);
  }, [reminderFeedback, setReminderFeedback]);

  useEffect(() => {
    if (!cloudBackupFeedback) {
      return;
    }
    const timer = setTimeout(() => {
      setCloudBackupFeedback(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [cloudBackupFeedback, setCloudBackupFeedback]);
}

