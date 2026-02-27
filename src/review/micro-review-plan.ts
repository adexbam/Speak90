import type { Day } from '../data/day-model';
import type { SrsCard } from '../data/srs-store';
import type { ReviewPlan } from '../data/review-plan-loader';

export type ResolvedMicroReviewPlan = {
  cards: SrsCard[];
  memorySentences: string[];
  source: 'previous_day' | 'none';
};

function getPreviousDayPatternMemorySentences(params: {
  allDays: Day[];
  currentDayNumber: number;
  maxCount: number;
}): string[] {
  const previousDayNumber = params.currentDayNumber - 1;
  if (previousDayNumber <= 0) {
    return [];
  }

  const previousDay = params.allDays.find((item) => item.dayNumber === previousDayNumber);
  const patternSection = previousDay?.sections.find((section) => section.type === 'patterns');
  if (!patternSection) {
    return [];
  }

  return patternSection.sentences.slice(0, Math.max(0, params.maxCount));
}

export function resolveMicroReviewPlan(params: {
  allDays: Day[];
  cards: SrsCard[];
  currentDayNumber: number;
  reviewPlan: ReviewPlan;
}): ResolvedMicroReviewPlan {
  const maxCards = Math.max(0, params.reviewPlan.dailyMicroReview.ankiCardCount);
  const previousDay = Math.max(1, params.currentDayNumber - 1);
  const cards = params.cards
    .filter((card) => card.dayNumber === previousDay)
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(0, maxCards);
  const source: ResolvedMicroReviewPlan['source'] = cards.length > 0 ? 'previous_day' : 'none';

  const memorySentences = getPreviousDayPatternMemorySentences({
    allDays: params.allDays,
    currentDayNumber: params.currentDayNumber,
    maxCount: params.reviewPlan.dailyMicroReview.memorySentenceCount,
  });

  return {
    cards,
    source,
    memorySentences,
  };
}
