import type { UserProgress } from '../data/progress-store';
import { computeReviewGuardrail } from './review-guardrail';

function makeProgress(overrides?: Partial<UserProgress>): UserProgress {
  return {
    currentDay: 1,
    streak: 0,
    sessionsCompleted: [],
    totalMinutes: 0,
    reviewModeCompletionCounts: {
      new_day: 0,
      light_review: 0,
      deep_consolidation: 0,
      milestone: 0,
    },
    ...overrides,
  };
}

describe('review-guardrail', () => {
  it('flags low reinforcement when ratio is below 20%', () => {
    const summary = computeReviewGuardrail(
      makeProgress({
        reviewModeCompletionCounts: {
          new_day: 10,
          light_review: 1,
          deep_consolidation: 0,
          milestone: 0,
        },
        completedReinforcementCheckpointDays: [],
      }),
    );

    expect(summary.status).toBe('low_reinforcement');
    expect(summary.message).toContain('below 20%');
  });

  it('flags high reinforcement when ratio is above 30%', () => {
    const summary = computeReviewGuardrail(
      makeProgress({
        reviewModeCompletionCounts: {
          new_day: 4,
          light_review: 2,
          deep_consolidation: 1,
          milestone: 0,
        },
        completedReinforcementCheckpointDays: [15, 30],
      }),
    );

    expect(summary.status).toBe('high_reinforcement');
    expect(summary.message).toContain('above 30%');
  });

  it('returns balanced when ratio is within 20%-30%', () => {
    const summary = computeReviewGuardrail(
      makeProgress({
        reviewModeCompletionCounts: {
          new_day: 8,
          light_review: 2,
          deep_consolidation: 0,
          milestone: 0,
        },
        completedReinforcementCheckpointDays: [15],
      }),
    );

    expect(summary.status).toBe('balanced');
    expect(summary.message).toBeNull();
  });
});
