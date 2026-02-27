import type { Day } from '../data/day-model';
import { DEFAULT_REVIEW_PLAN } from '../data/review-plan-loader';
import type { SrsCard } from '../data/srs-store';
import { resolveMicroReviewPlan } from './micro-review-plan';

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

describe('micro-review-plan', () => {
  it('resolves previous-day cards + previous-day pattern memory sentences', () => {
    const days: Day[] = [
      {
        dayNumber: 1,
        sections: [
          { id: 'patterns', type: 'patterns', title: 'Patterns', sentences: ['A -> B', 'C -> D'], reps: 1, duration: 60 },
        ],
      },
      {
        dayNumber: 2,
        sections: [
          { id: 'patterns', type: 'patterns', title: 'Patterns', sentences: ['E -> F'], reps: 1, duration: 60 },
        ],
      },
    ];

    const result = resolveMicroReviewPlan({
      allDays: days,
      cards: [makeCard(1, 0), makeCard(1, 1), makeCard(2, 0)],
      currentDayNumber: 2,
      reviewPlan: DEFAULT_REVIEW_PLAN,
    });

    expect(result.cards.map((card) => card.dayNumber)).toEqual([1, 1]);
    expect(result.source).toBe('previous_day');
    expect(result.memorySentences).toEqual(['A -> B', 'C -> D']);
  });
});

