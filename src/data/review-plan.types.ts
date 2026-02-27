export type ReviewBlock = {
  id: string;
  title: string;
  instructions: string[];
  durationMinutes?: number;
};

export type ReviewPlan = {
  weeklyCadence: {
    newDaysPerWeek: number;
    lightReviewDaysPerWeek: number;
    deepConsolidationDaysPerWeek: number;
  };
  lightReview: {
    durationMinutesMin: number;
    durationMinutesMax: number;
    blocks: ReviewBlock[];
  };
  deepConsolidation: {
    durationMinutes: number;
    blocks: ReviewBlock[];
  };
  reinforcementCheckpoints: Array<{
    currentDay: number;
    reviewDay: number;
  }>;
  milestoneDays: number[];
  dailyMicroReview: {
    ankiCardsFromAtLeastDaysAgo: number;
    ankiCardCount: number;
    memorySentenceCount: number;
  };
};
