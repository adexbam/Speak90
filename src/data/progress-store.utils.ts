import { DEFAULT_PROGRESS, DEFAULT_REVIEW_MODE_COMPLETION_COUNTS } from './progress-store.constants';
import type { UserProgress } from './progress-store.types';

export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function yesterdayKey(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return toLocalDateKey(d);
}

export function sanitizeProgress(input: unknown): UserProgress {
  if (typeof input !== 'object' || input === null) {
    return DEFAULT_PROGRESS;
  }

  const p = input as Partial<UserProgress>;

  const currentDay = Number.isInteger(p.currentDay) && (p.currentDay ?? 0) > 0 ? (p.currentDay as number) : 1;
  const streak = Number.isInteger(p.streak) && (p.streak ?? -1) >= 0 ? (p.streak as number) : 0;
  const sessionsCompleted = Array.isArray(p.sessionsCompleted)
    ? [...new Set(p.sessionsCompleted.filter((v): v is number => Number.isInteger(v) && v > 0))].sort((a, b) => a - b)
    : [];
  const totalMinutes = Number.isFinite(p.totalMinutes) && (p.totalMinutes ?? -1) >= 0 ? Number(p.totalMinutes) : 0;
  const lastCompletedDate = typeof p.lastCompletedDate === 'string' ? p.lastCompletedDate : undefined;
  const lightReviewCompletedDates = Array.isArray(p.lightReviewCompletedDates)
    ? [...new Set(p.lightReviewCompletedDates.filter((v): v is string => typeof v === 'string' && v.length > 0))].sort()
    : [];
  const deepConsolidationCompletedDates = Array.isArray(p.deepConsolidationCompletedDates)
    ? [...new Set(p.deepConsolidationCompletedDates.filter((v): v is string => typeof v === 'string' && v.length > 0))].sort()
    : [];
  const completedReinforcementCheckpointDays = Array.isArray(p.completedReinforcementCheckpointDays)
    ? [...new Set(p.completedReinforcementCheckpointDays.filter((v): v is number => Number.isInteger(v) && v > 0))].sort((a, b) => a - b)
    : [];
  const offeredReinforcementCheckpointDays = Array.isArray(p.offeredReinforcementCheckpointDays)
    ? [...new Set(p.offeredReinforcementCheckpointDays.filter((v): v is number => Number.isInteger(v) && v > 0))].sort((a, b) => a - b)
    : [];
  const microReviewShownDates = Array.isArray(p.microReviewShownDates)
    ? [...new Set(p.microReviewShownDates.filter((v): v is string => typeof v === 'string' && v.length > 0))].sort()
    : [];
  const microReviewCompletedDates = Array.isArray(p.microReviewCompletedDates)
    ? [...new Set(p.microReviewCompletedDates.filter((v): v is string => typeof v === 'string' && v.length > 0))].sort()
    : [];
  const reviewModeCompletionCounts = p.reviewModeCompletionCounts ?? DEFAULT_REVIEW_MODE_COMPLETION_COUNTS;

  return {
    currentDay,
    streak,
    sessionsCompleted,
    totalMinutes,
    lastCompletedDate,
    lightReviewCompletedDates,
    deepConsolidationCompletedDates,
    completedReinforcementCheckpointDays,
    offeredReinforcementCheckpointDays,
    microReviewShownDates,
    microReviewCompletedDates,
    reviewModeCompletionCounts: {
      new_day: Number.isInteger(reviewModeCompletionCounts?.new_day) && (reviewModeCompletionCounts?.new_day ?? 0) >= 0
        ? (reviewModeCompletionCounts.new_day as number)
        : 0,
      light_review: Number.isInteger(reviewModeCompletionCounts?.light_review) && (reviewModeCompletionCounts?.light_review ?? 0) >= 0
        ? (reviewModeCompletionCounts.light_review as number)
        : 0,
      deep_consolidation:
        Number.isInteger(reviewModeCompletionCounts?.deep_consolidation) && (reviewModeCompletionCounts?.deep_consolidation ?? 0) >= 0
          ? (reviewModeCompletionCounts.deep_consolidation as number)
          : 0,
      milestone: Number.isInteger(reviewModeCompletionCounts?.milestone) && (reviewModeCompletionCounts?.milestone ?? 0) >= 0
        ? (reviewModeCompletionCounts.milestone as number)
        : 0,
    },
  };
}
