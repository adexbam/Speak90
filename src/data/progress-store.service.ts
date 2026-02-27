import { DEFAULT_REVIEW_MODE_COMPLETION_COUNTS } from './progress-store.constants';
import { loadProgressRecord, saveProgressRecord } from './progress-store.repository';
import { toLocalDateKey, yesterdayKey } from './progress-store.utils';
import type { ReviewMode, UserProgress } from './progress-store.types';

export async function completeSession(params: {
  completedDay: number;
  sessionSeconds: number;
  totalDays: number;
}): Promise<UserProgress> {
  const now = new Date();
  const today = toLocalDateKey(now);
  const yesterday = yesterdayKey(now);

  const progress = await loadProgressRecord();
  const sessionMinutes = params.sessionSeconds > 0 ? Math.max(1, Math.ceil(params.sessionSeconds / 60)) : 0;

  let streak = progress.streak;
  if (progress.lastCompletedDate !== today) {
    streak = progress.lastCompletedDate === yesterday ? progress.streak + 1 : 1;
  }

  const sessionsCompleted = [...new Set([...progress.sessionsCompleted, params.completedDay])].sort((a, b) => a - b);

  const shouldAdvanceDay = progress.currentDay === params.completedDay;
  const currentDay = shouldAdvanceDay
    ? Math.min(params.totalDays, progress.currentDay + 1)
    : Math.min(params.totalDays, progress.currentDay);

  const updated: UserProgress = {
    ...progress,
    currentDay,
    streak,
    sessionsCompleted,
    totalMinutes: progress.totalMinutes + sessionMinutes,
    lastCompletedDate: today,
  };

  await saveProgressRecord(updated);
  return updated;
}

export async function completeLightReview(date = new Date()): Promise<UserProgress> {
  const progress = await loadProgressRecord();
  const today = toLocalDateKey(date);
  const existing = progress.lightReviewCompletedDates ?? [];
  const nextDates = [...new Set([...existing, today])].sort();

  const updated: UserProgress = {
    ...progress,
    lightReviewCompletedDates: nextDates,
  };

  await saveProgressRecord(updated);
  return updated;
}

export async function completeDeepConsolidation(date = new Date()): Promise<UserProgress> {
  const progress = await loadProgressRecord();
  const today = toLocalDateKey(date);
  const existing = progress.deepConsolidationCompletedDates ?? [];
  const nextDates = [...new Set([...existing, today])].sort();

  const updated: UserProgress = {
    ...progress,
    deepConsolidationCompletedDates: nextDates,
  };

  await saveProgressRecord(updated);
  return updated;
}

export async function completeReinforcementCheckpoint(checkpointDay: number): Promise<UserProgress> {
  const progress = await loadProgressRecord();
  if (!Number.isInteger(checkpointDay) || checkpointDay <= 0) {
    return progress;
  }

  const existing = progress.completedReinforcementCheckpointDays ?? [];
  const offered = progress.offeredReinforcementCheckpointDays ?? [];
  const nextCheckpointDays = [...new Set([...existing, checkpointDay])].sort((a, b) => a - b);
  const nextOfferedDays = [...new Set([...offered, checkpointDay])].sort((a, b) => a - b);

  const updated: UserProgress = {
    ...progress,
    completedReinforcementCheckpointDays: nextCheckpointDays,
    offeredReinforcementCheckpointDays: nextOfferedDays,
  };

  await saveProgressRecord(updated);
  return updated;
}

export async function markReinforcementCheckpointOffered(checkpointDay: number): Promise<UserProgress> {
  const progress = await loadProgressRecord();
  if (!Number.isInteger(checkpointDay) || checkpointDay <= 0) {
    return progress;
  }

  const offered = progress.offeredReinforcementCheckpointDays ?? [];
  const nextOfferedDays = [...new Set([...offered, checkpointDay])].sort((a, b) => a - b);
  const updated: UserProgress = {
    ...progress,
    offeredReinforcementCheckpointDays: nextOfferedDays,
  };
  await saveProgressRecord(updated);
  return updated;
}

export async function markMicroReviewShown(date = new Date()): Promise<UserProgress> {
  const progress = await loadProgressRecord();
  const dateKey = toLocalDateKey(date);
  const shownDates = progress.microReviewShownDates ?? [];
  const nextShownDates = [...new Set([...shownDates, dateKey])].sort();
  const updated: UserProgress = {
    ...progress,
    microReviewShownDates: nextShownDates,
  };
  await saveProgressRecord(updated);
  return updated;
}

export async function markMicroReviewCompleted(date = new Date()): Promise<UserProgress> {
  const progress = await loadProgressRecord();
  const dateKey = toLocalDateKey(date);
  const completedDates = progress.microReviewCompletedDates ?? [];
  const nextCompletedDates = [...new Set([...completedDates, dateKey])].sort();
  const shownDates = progress.microReviewShownDates ?? [];
  const nextShownDates = [...new Set([...shownDates, dateKey])].sort();
  const updated: UserProgress = {
    ...progress,
    microReviewShownDates: nextShownDates,
    microReviewCompletedDates: nextCompletedDates,
  };
  await saveProgressRecord(updated);
  return updated;
}

export async function incrementReviewModeCompletion(mode: ReviewMode): Promise<UserProgress> {
  const progress = await loadProgressRecord();
  const current = progress.reviewModeCompletionCounts ?? DEFAULT_REVIEW_MODE_COMPLETION_COUNTS;
  const updated: UserProgress = {
    ...progress,
    reviewModeCompletionCounts: {
      ...current,
      [mode]: (current[mode] ?? 0) + 1,
    },
  };
  await saveProgressRecord(updated);
  return updated;
}
