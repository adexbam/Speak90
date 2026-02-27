import { DEFAULT_REVIEW_PLAN } from '../data/review-plan-loader';
import type { SrsCard } from '../data/srs-store';
import { buildMicroReviewPayload } from './micro-review';

function makeCard(dayNumber: number, index: number): SrsCard {
  return {
    id: `d${dayNumber}:anki:${index}`,
    dayNumber,
    sectionId: 'anki-a',
    sentenceIndex: index,
    prompt: `Prompt ${dayNumber}-${index}`,
    answer: `Answer ${dayNumber}-${index}`,
    box: 1,
    dueDate: '2026-01-01',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    reviewCount: 0,
    successCount: 0,
  };
}

describe('micro-review', () => {
  it('selects cards only from previous day', () => {
    const cards = [makeCard(1, 0), makeCard(1, 1), makeCard(2, 0), makeCard(3, 0), makeCard(4, 0)];
    const payload = buildMicroReviewPayload({
      cards,
      currentDay: 3,
      reviewPlan: DEFAULT_REVIEW_PLAN,
    });

    expect(payload.cards.map((card) => card.dayNumber)).toEqual([2]);
    expect(payload.source).toBe('previous_day');
  });

  it('returns no cards when previous day pool is empty', () => {
    const cards = [makeCard(1, 0), makeCard(2, 0), makeCard(5, 0)];
    const payload = buildMicroReviewPayload({
      cards,
      currentDay: 4,
      reviewPlan: DEFAULT_REVIEW_PLAN,
    });

    expect(payload.cards).toHaveLength(0);
    expect(payload.memorySentences).toHaveLength(0);
    expect(payload.source).toBe('none');
  });
});
