import { useCallback } from 'react';
import { confirmAction } from '../../utils/confirmAction';

type UseHomeReminderGateParams = {
  reminderEnabled: boolean;
  enableReminder: () => Promise<void>;
  disableReminder: () => Promise<void>;
};

export function useHomeReminderGate({
  reminderEnabled,
  enableReminder,
  disableReminder,
}: UseHomeReminderGateParams) {
  const toggleReminder = useCallback(async () => {
    if (reminderEnabled) {
      await disableReminder();
      return;
    }

    const confirmed = await confirmAction({
      title: 'Enable Daily Reminder?',
      message: 'Speak90 would like to send one daily reminder. You can disable this anytime.',
      confirmText: 'Enable',
    });
    if (!confirmed) {
      return;
    }
    await enableReminder();
  }, [reminderEnabled, disableReminder, enableReminder]);

  return {
    toggleReminder,
  };
}

