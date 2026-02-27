import { useMemo } from 'react';
import { loadDays } from '../../data/day-loader';
import { useDailyMode } from '../../review/useDailyMode';
import { loadReviewPlan } from '../../data/review-plan-loader';
import { buildTodayPlanViewModel } from '../../review/today-plan-view-model';
import { useHomeProgress } from './useHomeProgress';

export function useHomePlanModel() {
  const days = useMemo(() => loadDays(), []);
  const { progress, sessionDraft, currentDay, hasResumeForCurrentDay, startOver } = useHomeProgress({ totalDays: days.length });
  const { resolution: dailyModeResolution } = useDailyMode({ progress });
  const reviewPlan = useMemo(() => loadReviewPlan(), []);

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
    progress,
    currentDay,
    dailyModeResolution,
    startOver,
    todayPlan,
    todayModeLabel,
    canResumeTodayPlan,
    streak,
    averageMinutes,
  };
}

