import type { UserProgress } from '../data/progress-store';
import { DEFAULT_REVIEW_PLAN } from '../data/review-plan-loader';
import { buildTodayPlanViewModel } from './today-plan-view-model';

const baseProgress: UserProgress = {
  currentDay: 2,
  streak: 1,
  sessionsCompleted: [1],
  totalMinutes: 10,
  reviewModeCompletionCounts: {
    new_day: 1,
    light_review: 0,
    deep_consolidation: 0,
    milestone: 0,
  },
};

describe('today-plan-view-model', () => {
  it('builds new day plan with micro review from day 2', () => {
    const model = buildTodayPlanViewModel({
      currentDay: 2,
      resolution: {
        mode: 'new_day',
        weeklySlot: 'new',
        currentDay: 2,
        isMilestoneDay: false,
        reinforcementReviewDay: null,
        reinforcementCheckpointDay: null,
        pendingReinforcementCheckpointDays: [],
        dateKey: '2026-02-27',
      },
      reviewPlan: DEFAULT_REVIEW_PLAN,
      progress: baseProgress,
    });

    expect(model.modeLabel).toBe('New Day');
    expect(model.checklist).toContain('Micro-review: Session 1 previous-day Anki + Session 2 memory drill');
    expect(model.checklist).toContain('Main session: 7 sections');
  });

  it('builds milestone plan checklist', () => {
    const model = buildTodayPlanViewModel({
      currentDay: 30,
      resolution: {
        mode: 'milestone',
        weeklySlot: 'new',
        currentDay: 30,
        isMilestoneDay: true,
        reinforcementReviewDay: null,
        reinforcementCheckpointDay: null,
        pendingReinforcementCheckpointDays: [],
        dateKey: '2026-02-27',
      },
      reviewPlan: DEFAULT_REVIEW_PLAN,
      progress: baseProgress,
    });

    expect(model.modeLabel).toBe('Milestone');
    expect(model.durationLabel).toBe('10 min');
    expect(model.checklist[0]).toContain('10-minute continuous fluency recording');
  });
});

