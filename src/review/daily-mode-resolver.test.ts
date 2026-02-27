import type { UserProgress } from '../data/progress-store';
import { DEFAULT_REVIEW_PLAN } from '../data/review-plan-loader';
import { resolveDailyMode } from './daily-mode-resolver';

const BASE_PROGRESS: UserProgress = {
  currentDay: 14,
  streak: 3,
  sessionsCompleted: [1, 2, 3],
  totalMinutes: 120,
};

describe('daily-mode-resolver', () => {
  it('enforces cadence by completion cycle (5 new -> 1 light -> 1 deep)', () => {
    const nextNew = resolveDailyMode({
      progress: {
        ...BASE_PROGRESS,
        reviewModeCompletionCounts: {
          new_day: 0,
          light_review: 0,
          deep_consolidation: 0,
          milestone: 0,
        },
      },
      reviewPlan: DEFAULT_REVIEW_PLAN,
    });
    expect(nextNew.mode).toBe('new_day');

    const nextLight = resolveDailyMode({
      progress: {
        ...BASE_PROGRESS,
        reviewModeCompletionCounts: {
          new_day: 5,
          light_review: 0,
          deep_consolidation: 0,
          milestone: 0,
        },
      },
      reviewPlan: DEFAULT_REVIEW_PLAN,
    });
    expect(nextLight.mode).toBe('light_review');

    const nextDeep = resolveDailyMode({
      progress: {
        ...BASE_PROGRESS,
        reviewModeCompletionCounts: {
          new_day: 5,
          light_review: 1,
          deep_consolidation: 0,
          milestone: 0,
        },
      },
      reviewPlan: DEFAULT_REVIEW_PLAN,
    });
    expect(nextDeep.mode).toBe('deep_consolidation');

    const cycleResets = resolveDailyMode({
      progress: {
        ...BASE_PROGRESS,
        reviewModeCompletionCounts: {
          new_day: 5,
          light_review: 1,
          deep_consolidation: 1,
          milestone: 0,
        },
      },
      reviewPlan: DEFAULT_REVIEW_PLAN,
    });
    expect(cycleResets.mode).toBe('new_day');
  });

  it('applies reinforcement insertion for checkpoint day', () => {
    const result = resolveDailyMode({
      progress: {
        ...BASE_PROGRESS,
        currentDay: 30,
      },
      date: new Date('2026-02-24T08:00:00'),
      reviewPlan: DEFAULT_REVIEW_PLAN,
    });

    expect(result.reinforcementReviewDay).toBe(10);
    expect(result.reinforcementCheckpointDay).toBe(30);
    expect(result.pendingReinforcementCheckpointDays).toEqual([15, 30]);
  });

  it('keeps missed reinforcement pending until completed', () => {
    const missed = resolveDailyMode({
      progress: {
        ...BASE_PROGRESS,
        currentDay: 46,
      },
      date: new Date('2026-03-04T08:00:00'),
      reviewPlan: DEFAULT_REVIEW_PLAN,
    });
    // Day 45 checkpoint should still be pending at day 46.
    expect(missed.reinforcementCheckpointDay).toBe(45);
    expect(missed.reinforcementReviewDay).toBe(15);
    expect(missed.pendingReinforcementCheckpointDays).toContain(45);

    const completed = resolveDailyMode({
      progress: {
        ...BASE_PROGRESS,
        currentDay: 46,
        completedReinforcementCheckpointDays: [15, 30, 45],
      },
      date: new Date('2026-03-04T08:00:00'),
      reviewPlan: DEFAULT_REVIEW_PLAN,
    });
    expect(completed.reinforcementCheckpointDay).toBeNull();
    expect(completed.reinforcementReviewDay).toBeNull();
  });

  it('milestone mode overrides cadence slot', () => {
    const milestone = resolveDailyMode({
      progress: {
        ...BASE_PROGRESS,
        currentDay: 60,
        reviewModeCompletionCounts: {
          new_day: 5,
          light_review: 0,
          deep_consolidation: 0,
          milestone: 0,
        },
      },
      reviewPlan: DEFAULT_REVIEW_PLAN,
    });

    expect(milestone.weeklySlot).toBe('light');
    expect(milestone.mode).toBe('milestone');
    expect(milestone.isMilestoneDay).toBe(true);
  });
});
