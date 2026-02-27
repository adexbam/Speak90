import { DEFAULT_REVIEW_PLAN } from './review-plan.defaults';
import { parseReviewPlanConfig } from './review-plan.normalize';
import type { ReviewBlock, ReviewPlan } from './review-plan.types';

export type { ReviewBlock, ReviewPlan };
export { DEFAULT_REVIEW_PLAN, parseReviewPlanConfig };

let cachedReviewPlan: ReviewPlan | null = null;

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
