import type { SrsCard } from '../../data/srs-store';
import { computeSrsMetrics } from './stats-metrics';

describe('computeSrsMetrics', () => {
  it('computes due, accuracy, and box distribution', () => {
    const cards: SrsCard[] = [
      {
        id: '1',
        dayNumber: 1,
        sectionId: 'anki-a',
        sentenceIndex: 0,
        prompt: 'A',
        answer: 'B',
        box: 1,
        dueDate: '2026-02-19',
        createdAt: '2026-02-18T00:00:00.000Z',
        updatedAt: '2026-02-19T00:00:00.000Z',
        reviewCount: 2,
        successCount: 1,
      },
      {
        id: '2',
        dayNumber: 1,
        sectionId: 'anki-a',
        sentenceIndex: 1,
        prompt: 'C',
        answer: 'D',
        box: 3,
        dueDate: '2026-02-20',
        createdAt: '2026-02-18T00:00:00.000Z',
        updatedAt: '2026-02-19T00:00:00.000Z',
        reviewCount: 1,
        successCount: 1,
      },
    ];

    const metrics = computeSrsMetrics(cards, new Date('2026-02-19T12:00:00.000Z'));
    expect(metrics.totalCards).toBe(2);
    expect(metrics.dueToday).toBe(1);
    expect(metrics.totalReviews).toBe(3);
    expect(metrics.totalSuccess).toBe(2);
    expect(metrics.accuracyPercent).toBe(67);
    expect(metrics.boxCounts[1]).toBe(1);
    expect(metrics.boxCounts[3]).toBe(1);
  });
});
