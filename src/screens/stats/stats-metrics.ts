import type { SrsCard } from '../../data/srs-store';

export type SrsMetrics = {
  totalCards: number;
  dueToday: number;
  reviewedCards: number;
  totalReviews: number;
  totalSuccess: number;
  accuracyPercent: number;
  boxCounts: Record<number, number>;
};

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function computeSrsMetrics(cards: SrsCard[], now = new Date()): SrsMetrics {
  const today = toLocalDateKey(now);
  const dueToday = cards.filter((card) => card.dueDate <= today).length;
  const totalReviews = cards.reduce((sum, card) => sum + card.reviewCount, 0);
  const totalSuccess = cards.reduce((sum, card) => sum + card.successCount, 0);
  const reviewedCards = cards.filter((card) => card.reviewCount > 0).length;
  const accuracyPercent = totalReviews > 0 ? Math.round((totalSuccess / totalReviews) * 100) : 0;
  const boxCounts = cards.reduce<Record<number, number>>((acc, card) => {
    acc[card.box] = (acc[card.box] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalCards: cards.length,
    dueToday,
    reviewedCards,
    totalReviews,
    totalSuccess,
    accuracyPercent,
    boxCounts,
  };
}
