import type { UserProgress } from '../data/progress-store';

export const REVIEW_GUARDRAIL_MIN = 0.2;
export const REVIEW_GUARDRAIL_MAX = 0.3;

export type ReviewGuardrailStatus = 'balanced' | 'low_reinforcement' | 'high_reinforcement';

export type ReviewGuardrailSummary = {
  forwardCount: number;
  reinforcementCount: number;
  reinforcementRatio: number;
  status: ReviewGuardrailStatus;
  message: string | null;
};

export function computeReviewGuardrail(
  progress: UserProgress,
  options?: {
    min?: number;
    max?: number;
  },
): ReviewGuardrailSummary {
  const min = options?.min ?? REVIEW_GUARDRAIL_MIN;
  const max = options?.max ?? REVIEW_GUARDRAIL_MAX;

  const modeCounts = progress.reviewModeCompletionCounts ?? {
    new_day: 0,
    light_review: 0,
    deep_consolidation: 0,
    milestone: 0,
  };

  const forwardCount = Math.max(0, modeCounts.new_day ?? 0);
  const reviewModeCount =
    Math.max(0, modeCounts.light_review ?? 0) +
    Math.max(0, modeCounts.deep_consolidation ?? 0) +
    Math.max(0, modeCounts.milestone ?? 0);
  const reinforcementCheckpointCount = Math.max(0, progress.completedReinforcementCheckpointDays?.length ?? 0);
  const reinforcementCount = reviewModeCount + reinforcementCheckpointCount;

  const total = forwardCount + reinforcementCount;
  if (total <= 0) {
    return {
      forwardCount,
      reinforcementCount,
      reinforcementRatio: 0,
      status: 'balanced',
      message: null,
    };
  }

  const reinforcementRatio = reinforcementCount / total;
  if (reinforcementRatio < min) {
    return {
      forwardCount,
      reinforcementCount,
      reinforcementRatio,
      status: 'low_reinforcement',
      message: 'Review is below 20%. Add a light/deep review block this week.',
    };
  }

  if (reinforcementRatio > max) {
    return {
      forwardCount,
      reinforcementCount,
      reinforcementRatio,
      status: 'high_reinforcement',
      message: 'Review is above 30%. Shift focus back to new-day progression.',
    };
  }

  return {
    forwardCount,
    reinforcementCount,
    reinforcementRatio,
    status: 'balanced',
    message: null,
  };
}
