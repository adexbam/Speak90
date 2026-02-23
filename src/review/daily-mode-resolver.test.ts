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
  it('enforces weekly cadence for weekdays', () => {
    // Monday -> new day
    const monday = new Date('2026-02-23T08:00:00');
    const mondayResult = resolveDailyMode({
      progress: BASE_PROGRESS,
      date: monday,
      reviewPlan: DEFAULT_REVIEW_PLAN,
    });
    expect(mondayResult.mode).toBe('new_day');

    // Saturday -> light review
    const saturday = new Date('2026-02-28T08:00:00');
    const saturdayResult = resolveDailyMode({
      progress: BASE_PROGRESS,
      date: saturday,
      reviewPlan: DEFAULT_REVIEW_PLAN,
    });
    expect(saturdayResult.mode).toBe('light_review');

    // Sunday -> deep consolidation
    const sunday = new Date('2026-03-01T08:00:00');
    const sundayResult = resolveDailyMode({
      progress: BASE_PROGRESS,
      date: sunday,
      reviewPlan: DEFAULT_REVIEW_PLAN,
    });
    expect(sundayResult.mode).toBe('deep_consolidation');
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

  it('milestone mode overrides weekly slot', () => {
    const saturdayMilestone = resolveDailyMode({
      progress: {
        ...BASE_PROGRESS,
        currentDay: 60,
      },
      date: new Date('2026-02-28T08:00:00'),
      reviewPlan: DEFAULT_REVIEW_PLAN,
    });

    expect(saturdayMilestone.weeklySlot).toBe('light');
    expect(saturdayMilestone.mode).toBe('milestone');
    expect(saturdayMilestone.isMilestoneDay).toBe(true);
  });
});
