import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { loadDays } from '../../data/day-loader';
import { useFeatureFlags } from '../../config/useFeatureFlags';
import { useDailyMode } from '../../review/useDailyMode';
import { loadReviewPlan } from '../../data/review-plan-loader';
import { buildTodayPlanViewModel } from '../../review/today-plan-view-model';
import { useHomeProgress } from './useHomeProgress';
import { useHomeReminderController } from './useHomeReminderController';
import { useHomeReminderGate } from './useHomeReminderGate';
import { useHomeSessionController } from './useHomeSessionController';

export function useHomeViewModel() {
  const router = useRouter();
  const days = useMemo(() => loadDays(), []);
  const { progress, sessionDraft, currentDay, hasResumeForCurrentDay, startOver } = useHomeProgress({ totalDays: days.length });
  const { resolution: dailyModeResolution } = useDailyMode({ progress });
  const reminderController = useHomeReminderController({ currentDay });
  const reminderGate = useHomeReminderGate({
    reminderEnabled: reminderController.reminderSettings.enabled,
    enableReminder: reminderController.enableReminder,
    disableReminder: reminderController.disableReminder,
  });
  const sessionController = useHomeSessionController({
    router,
    currentDay,
    dailyModeResolution,
    startOver,
  });
  const reviewPlan = useMemo(() => loadReviewPlan(), []);
  const { flags, isLoading: isFlagsLoading, lastUpdatedAt, errorMessage: flagsErrorMessage, refreshFlags } = useFeatureFlags();

  const todayPlan = useMemo(
    () =>
      buildTodayPlanViewModel({
        currentDay,
        resolution: dailyModeResolution,
        reviewPlan,
        progress,
      }),
    [currentDay, dailyModeResolution, reviewPlan, progress],
  );
  const todayModeLabel = todayPlan.modeLabel;
  const todayModeKey = todayPlan.modeKey;
  const canResumeTodayPlan =
    !!sessionDraft &&
    sessionDraft.dayNumber === currentDay &&
    (sessionDraft.mode ?? 'new_day') === todayModeKey &&
    hasResumeForCurrentDay;

  const streak = progress.streak;
  const averageMinutes = progress.sessionsCompleted.length > 0 ? Math.round(progress.totalMinutes / progress.sessionsCompleted.length) : 0;

  return {
    currentDay,
    dailyModeResolution,
    progress,
    streak,
    averageMinutes,
    todayModeLabel,
    todayPlan,
    canResumeTodayPlan,
    sessionController,
    reminderController,
    reminderGate,
    flags,
    isFlagsLoading,
    lastUpdatedAt,
    flagsErrorMessage,
    refreshFlags,
    goToOnboarding: () => {
      router.push('/onboarding');
    },
    goToStats: () => {
      router.push('/stats');
    },
  };
}

