import { useFeatureFlags } from '../../config/useFeatureFlags';
import { useHomeReminderController } from './useHomeReminderController';
import { useHomeReminderGate } from './useHomeReminderGate';

type UseHomeSettingsModelParams = {
  currentDay: number;
};

export function useHomeSettingsModel({ currentDay }: UseHomeSettingsModelParams) {
  const reminderController = useHomeReminderController({ currentDay });
  const reminderGate = useHomeReminderGate({
    reminderEnabled: reminderController.reminderSettings.enabled,
    enableReminder: reminderController.enableReminder,
    disableReminder: reminderController.disableReminder,
  });
  const { flags, isLoading: isFlagsLoading, lastUpdatedAt, errorMessage: flagsErrorMessage, refreshFlags } = useFeatureFlags();

  return {
    reminderController,
    reminderGate,
    flags,
    isFlagsLoading,
    lastUpdatedAt,
    flagsErrorMessage,
    refreshFlags,
  };
}

