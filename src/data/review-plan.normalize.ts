import { DEFAULT_REVIEW_PLAN } from './review-plan.defaults';
import { isObject, isPositiveInteger, parseReviewBlocks } from './review-plan.schema';
import type { ReviewPlan } from './review-plan.types';

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
