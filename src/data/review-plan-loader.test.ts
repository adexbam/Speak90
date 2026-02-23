import { DEFAULT_REVIEW_PLAN, loadReviewPlan, parseReviewPlanConfig } from './review-plan-loader';

describe('review-plan-loader', () => {
  it('loads valid review plan from assets', () => {
    const plan = loadReviewPlan();

    expect(plan.weeklyCadence.newDaysPerWeek).toBe(5);
    expect(plan.weeklyCadence.lightReviewDaysPerWeek).toBe(1);
    expect(plan.weeklyCadence.deepConsolidationDaysPerWeek).toBe(1);
    expect(plan.reinforcementCheckpoints.length).toBeGreaterThan(0);
    expect(plan.milestoneDays).toEqual([30, 60, 90]);
    expect(plan.dailyMicroReview.ankiCardsFromAtLeastDaysAgo).toBe(30);
  });

  it('falls back to defaults for invalid config', () => {
    const invalid = {
      weeklyCadence: {
        newDaysPerWeek: 6,
        lightReviewDaysPerWeek: 1,
        deepConsolidationDaysPerWeek: 1,
      },
    };

    expect(parseReviewPlanConfig(invalid)).toEqual(DEFAULT_REVIEW_PLAN);
  });

  it('accepts a valid parsed shape', () => {
    const valid = {
      weeklyCadence: {
        newDaysPerWeek: 5,
        lightReviewDaysPerWeek: 1,
        deepConsolidationDaysPerWeek: 1,
      },
      lightReview: {
        durationMinutesMin: 20,
        durationMinutesMax: 30,
        blocks: [{ id: 'light-1', title: 'Light Block', instructions: ['A'], durationMinutes: 10 }],
      },
      deepConsolidation: {
        durationMinutes: 45,
        blocks: [{ id: 'deep-1', title: 'Deep Block', instructions: ['B'] }],
      },
      reinforcementCheckpoints: [{ currentDay: 15, reviewDay: 1 }],
      milestoneDays: [30, 60, 90],
      dailyMicroReview: {
        ankiCardsFromAtLeastDaysAgo: 30,
        ankiCardCount: 5,
        memorySentenceCount: 5,
      },
    };

    const parsed = parseReviewPlanConfig(valid);
    expect(parsed.weeklyCadence.newDaysPerWeek).toBe(5);
    expect(parsed.lightReview.blocks[0]?.id).toBe('light-1');
    expect(parsed.deepConsolidation.blocks[0]?.id).toBe('deep-1');
    expect(parsed.reinforcementCheckpoints[0]?.currentDay).toBe(15);
  });
});
