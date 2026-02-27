import type { SrsCard } from '../data/srs-store';
import type { ReviewPlan } from '../data/review-plan-loader';

export type MicroReviewPayload = {
  cards: SrsCard[];
  memorySentences: string[];
  source: 'old' | 'recent' | 'none';
};

export function buildMicroReviewPayload(params: {
  cards: SrsCard[];
  currentDay: number;
  reviewPlan: ReviewPlan;
}): MicroReviewPayload {
  const { cards, currentDay, reviewPlan } = params;
  const { ankiCardsFromAtLeastDaysAgo, ankiCardCount, memorySentenceCount } = reviewPlan.dailyMicroReview;
  const maxCards = Math.max(0, ankiCardCount);

  const eligibleOld = cards
    .filter((card) => card.dayNumber < currentDay && currentDay - card.dayNumber >= ankiCardsFromAtLeastDaysAgo)
    .sort((a, b) => {
      if (a.dayNumber !== b.dayNumber) {
        return a.dayNumber - b.dayNumber;
      }
      return a.id.localeCompare(b.id);
    });

  const eligibleRecent = cards
    .filter((card) => card.dayNumber < currentDay)
    .sort((a, b) => {
      if (a.dayNumber !== b.dayNumber) {
        return b.dayNumber - a.dayNumber;
      }
      return a.id.localeCompare(b.id);
    });

  const shouldUseOldPool = currentDay > ankiCardsFromAtLeastDaysAgo;
  const selectedCards = (shouldUseOldPool ? eligibleOld : eligibleRecent).slice(0, maxCards);
  const memoryPool = selectedCards.map((card) => card.answer).filter((value) => value.trim().length > 0);
  const memorySentences = [...new Set(memoryPool)].slice(0, Math.max(0, memorySentenceCount));
  const source: MicroReviewPayload['source'] = selectedCards.length > 0 ? (shouldUseOldPool ? 'old' : 'recent') : 'none';

  return {
    cards: selectedCards,
    memorySentences,
    source,
  };
}
