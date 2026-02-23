import type { SrsCard } from '../data/srs-store';
import type { ReviewPlan } from '../data/review-plan-loader';

export type MicroReviewPayload = {
  cards: SrsCard[];
  memorySentences: string[];
};

export function buildMicroReviewPayload(params: {
  cards: SrsCard[];
  currentDay: number;
  reviewPlan: ReviewPlan;
}): MicroReviewPayload {
  const { cards, currentDay, reviewPlan } = params;
  const { ankiCardsFromAtLeastDaysAgo, ankiCardCount, memorySentenceCount } = reviewPlan.dailyMicroReview;

  const eligible = cards
    .filter((card) => currentDay - card.dayNumber >= ankiCardsFromAtLeastDaysAgo)
    .sort((a, b) => {
      if (a.dayNumber !== b.dayNumber) {
        return a.dayNumber - b.dayNumber;
      }
      return a.id.localeCompare(b.id);
    });

  const selectedCards = eligible.slice(0, Math.max(0, ankiCardCount));
  const memoryPool = selectedCards.map((card) => card.answer).filter((value) => value.trim().length > 0);
  const memorySentences = [...new Set(memoryPool)].slice(0, Math.max(0, memorySentenceCount));

  return {
    cards: selectedCards,
    memorySentences,
  };
}
