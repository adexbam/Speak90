import { useReminderController } from './useReminderController';

type UseHomeReminderControllerParams = {
  currentDay: number;
};

export function useHomeReminderController({ currentDay }: UseHomeReminderControllerParams) {
  return useReminderController({ currentDay });
}
