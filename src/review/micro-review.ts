import type { SrsCard } from '../data/srs-store';
import type { ReviewPlan } from '../data/review-plan-loader';

export type MicroReviewPayload = {
  cards: SrsCard[];
  memorySentences: string[];
  source: 'previous_day' | 'none';
};

export function buildMicroReviewPayload(params: {
  cards: SrsCard[];
  currentDay: number;
  reviewPlan: ReviewPlan;
}): MicroReviewPayload {
  const { cards, currentDay, reviewPlan } = params;
  const { ankiCardCount } = reviewPlan.dailyMicroReview;
  const maxCards = Math.max(0, ankiCardCount);
  const previousDay = Math.max(1, currentDay - 1);
  const selectedCards = cards
    .filter((card) => card.dayNumber === previousDay)
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(0, maxCards);
  const source: MicroReviewPayload['source'] = selectedCards.length > 0 ? 'previous_day' : 'none';

  return {
    cards: selectedCards,
    memorySentences: [],
    source,
  };
}
