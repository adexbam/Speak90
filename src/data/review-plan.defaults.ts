import type { ReviewPlan } from './review-plan.types';

export const DEFAULT_REVIEW_PLAN: ReviewPlan = {
  weeklyCadence: {
    newDaysPerWeek: 5,
    lightReviewDaysPerWeek: 1,
    deepConsolidationDaysPerWeek: 1,
  },
  lightReview: {
    durationMinutesMin: 20,
    durationMinutesMax: 30,
    blocks: [],
  },
  deepConsolidation: {
    durationMinutes: 45,
    blocks: [],
  },
  reinforcementCheckpoints: [
    { currentDay: 15, reviewDay: 1 },
    { currentDay: 30, reviewDay: 10 },
    { currentDay: 45, reviewDay: 15 },
    { currentDay: 60, reviewDay: 20 },
    { currentDay: 75, reviewDay: 30 },
    { currentDay: 90, reviewDay: 45 },
  ],
  milestoneDays: [30, 60, 90],
  dailyMicroReview: {
    ankiCardsFromAtLeastDaysAgo: 30,
    ankiCardCount: 5,
    memorySentenceCount: 5,
  },
};
