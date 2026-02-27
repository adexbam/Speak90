export type ReviewMode = 'new_day' | 'light_review' | 'deep_consolidation' | 'milestone';

export interface ReviewModeCompletionCounts {
  new_day: number;
  light_review: number;
  deep_consolidation: number;
  milestone: number;
}

export interface UserProgress {
  currentDay: number;
  streak: number;
  sessionsCompleted: number[];
  totalMinutes: number;
  lastCompletedDate?: string;
  lightReviewCompletedDates?: string[];
  deepConsolidationCompletedDates?: string[];
  completedReinforcementCheckpointDays?: number[];
  offeredReinforcementCheckpointDays?: number[];
  microReviewShownDates?: string[];
  microReviewCompletedDates?: string[];
  reviewModeCompletionCounts?: ReviewModeCompletionCounts;
}
