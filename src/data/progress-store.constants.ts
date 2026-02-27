import type { ReviewModeCompletionCounts, UserProgress } from './progress-store.types';

export const PROGRESS_KEY = 'speak90:user-progress:v1';

export const DEFAULT_REVIEW_MODE_COMPLETION_COUNTS: ReviewModeCompletionCounts = {
  new_day: 0,
  light_review: 0,
  deep_consolidation: 0,
  milestone: 0,
};

export const DEFAULT_PROGRESS: UserProgress = {
  currentDay: 1,
  streak: 0,
  sessionsCompleted: [],
  totalMinutes: 0,
  reviewModeCompletionCounts: DEFAULT_REVIEW_MODE_COMPLETION_COUNTS,
};
