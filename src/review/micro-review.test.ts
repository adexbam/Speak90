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
  it('selects cards from 30+ day-old pool when current day is past threshold', () => {
    const cards = [makeCard(1, 0), makeCard(2, 0), makeCard(10, 0), makeCard(35, 0), makeCard(40, 0)];
    const payload = buildMicroReviewPayload({
      cards,
      currentDay: 40,
      reviewPlan: DEFAULT_REVIEW_PLAN,
    });

    // Eligible: day <= 10 (currentDay 40, threshold 30).
    expect(payload.cards.map((card) => card.dayNumber)).toEqual([1, 2, 10]);
    expect(payload.source).toBe('old');
  });

  it('falls back to recent pool when current day is not past threshold', () => {
    const cards = [makeCard(1, 0), makeCard(2, 0), makeCard(3, 0), makeCard(4, 0), makeCard(5, 0), makeCard(6, 0)];
    const payload = buildMicroReviewPayload({
      cards,
      currentDay: 6,
      reviewPlan: DEFAULT_REVIEW_PLAN,
    });

    expect(payload.cards.map((card) => card.dayNumber)).toEqual([5, 4, 3, 2, 1]);
    expect(payload.source).toBe('recent');
  });

  it('degrades gracefully when there are not enough eligible cards', () => {
    const cards = [makeCard(28, 0), makeCard(29, 0)];
    const payload = buildMicroReviewPayload({
      cards,
      currentDay: 40,
      reviewPlan: DEFAULT_REVIEW_PLAN,
    });

    expect(payload.cards).toHaveLength(0);
    expect(payload.memorySentences).toHaveLength(0);
    expect(payload.source).toBe('none');
  });
});
