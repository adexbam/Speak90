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

let cachedReviewPlan: ReviewPlan | null = null;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function parseReviewBlocks(value: unknown): ReviewBlock[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const parsed: ReviewBlock[] = [];
  for (const rawBlock of value) {
    if (!isObject(rawBlock)) {
      return null;
    }
    const { id, title, instructions, durationMinutes } = rawBlock;
    if (typeof id !== 'string' || id.length === 0) {
      return null;
    }
    if (typeof title !== 'string' || title.length === 0) {
      return null;
    }
    if (!isStringArray(instructions) || instructions.length === 0) {
      return null;
    }
    if (durationMinutes !== undefined && !isPositiveInteger(durationMinutes)) {
      return null;
    }
    parsed.push({
      id,
      title,
      instructions,
      ...(durationMinutes !== undefined ? { durationMinutes } : {}),
    });
  }
  return parsed;
}

export function parseReviewPlanConfig(value: unknown): ReviewPlan {
  if (!isObject(value)) {
    return DEFAULT_REVIEW_PLAN;
  }

  const {
    weeklyCadence,
    lightReview,
    deepConsolidation,
    reinforcementCheckpoints,
    milestoneDays,
    dailyMicroReview,
  } = value;

  if (!isObject(weeklyCadence) || !isObject(lightReview) || !isObject(deepConsolidation) || !isObject(dailyMicroReview)) {
    return DEFAULT_REVIEW_PLAN;
  }

  const weekly = {
    newDaysPerWeek: weeklyCadence.newDaysPerWeek,
    lightReviewDaysPerWeek: weeklyCadence.lightReviewDaysPerWeek,
    deepConsolidationDaysPerWeek: weeklyCadence.deepConsolidationDaysPerWeek,
  };

  if (
    !isPositiveInteger(weekly.newDaysPerWeek) ||
    !isPositiveInteger(weekly.lightReviewDaysPerWeek) ||
    !isPositiveInteger(weekly.deepConsolidationDaysPerWeek) ||
    weekly.newDaysPerWeek + weekly.lightReviewDaysPerWeek + weekly.deepConsolidationDaysPerWeek !== 7
  ) {
    return DEFAULT_REVIEW_PLAN;
  }

  if (!isPositiveInteger(lightReview.durationMinutesMin) || !isPositiveInteger(lightReview.durationMinutesMax)) {
    return DEFAULT_REVIEW_PLAN;
  }
  if (lightReview.durationMinutesMin > lightReview.durationMinutesMax) {
    return DEFAULT_REVIEW_PLAN;
  }

  const lightBlocks = parseReviewBlocks(lightReview.blocks);
  const deepBlocks = parseReviewBlocks(deepConsolidation.blocks);
  if (!lightBlocks || !deepBlocks || !isPositiveInteger(deepConsolidation.durationMinutes)) {
    return DEFAULT_REVIEW_PLAN;
  }

  if (!Array.isArray(reinforcementCheckpoints) || reinforcementCheckpoints.length === 0) {
    return DEFAULT_REVIEW_PLAN;
  }
  const parsedCheckpoints = reinforcementCheckpoints.map((checkpoint) => {
    if (!isObject(checkpoint) || !isPositiveInteger(checkpoint.currentDay) || !isPositiveInteger(checkpoint.reviewDay)) {
      return null;
    }
    return {
      currentDay: checkpoint.currentDay,
      reviewDay: checkpoint.reviewDay,
    };
  });
  if (parsedCheckpoints.some((checkpoint) => checkpoint === null)) {
    return DEFAULT_REVIEW_PLAN;
  }

  if (!Array.isArray(milestoneDays) || milestoneDays.length === 0 || milestoneDays.some((day) => !isPositiveInteger(day))) {
    return DEFAULT_REVIEW_PLAN;
  }

  if (
    !isPositiveInteger(dailyMicroReview.ankiCardsFromAtLeastDaysAgo) ||
    !isPositiveInteger(dailyMicroReview.ankiCardCount) ||
    !isPositiveInteger(dailyMicroReview.memorySentenceCount)
  ) {
    return DEFAULT_REVIEW_PLAN;
  }

  return {
    weeklyCadence: {
      newDaysPerWeek: weekly.newDaysPerWeek,
      lightReviewDaysPerWeek: weekly.lightReviewDaysPerWeek,
      deepConsolidationDaysPerWeek: weekly.deepConsolidationDaysPerWeek,
    },
    lightReview: {
      durationMinutesMin: lightReview.durationMinutesMin,
      durationMinutesMax: lightReview.durationMinutesMax,
      blocks: lightBlocks,
    },
    deepConsolidation: {
      durationMinutes: deepConsolidation.durationMinutes,
      blocks: deepBlocks,
    },
    reinforcementCheckpoints: parsedCheckpoints as Array<{ currentDay: number; reviewDay: number }>,
    milestoneDays: milestoneDays as number[],
    dailyMicroReview: {
      ankiCardsFromAtLeastDaysAgo: dailyMicroReview.ankiCardsFromAtLeastDaysAgo,
      ankiCardCount: dailyMicroReview.ankiCardCount,
      memorySentenceCount: dailyMicroReview.memorySentenceCount,
    },
  };
}

export function loadReviewPlan(): ReviewPlan {
  if (cachedReviewPlan) {
    return cachedReviewPlan;
  }

  try {
    const rawData: unknown = require('../../assets/data/review-plan.json');
    cachedReviewPlan = parseReviewPlanConfig(rawData);
    return cachedReviewPlan;
  } catch {
    cachedReviewPlan = DEFAULT_REVIEW_PLAN;
    return cachedReviewPlan;
  }
}
