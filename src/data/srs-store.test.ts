import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SRS_DAILY_CAP, ensureSrsCardsForDay, getDueSrsQueue, LEITNER_INTERVALS_DAYS, loadDueSrsQueue, reviewSrsCard } from './srs-store';
import type { Day } from './day-model';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

const SAMPLE_DAY: Day = {
  dayNumber: 31,
  sections: [
    {
      id: 'anki-a',
      type: 'anki',
      title: 'Anki Review (10min)',
      reps: 1,
      duration: 600,
      sentences: [
        'I start now. -> Ich beginne jetzt.',
        'I learn every day. -> Ich lerne jeden Tag.',
      ],
    },
  ],
};

describe('srs-store', () => {
  let state: Record<string, string>;

  beforeEach(() => {
    jest.clearAllMocks();
    state = {};
    storage.getItem.mockImplementation(async (key: string) => state[key] ?? null);
    storage.setItem.mockImplementation(async (key: string, value: string) => {
      state[key] = value;
    });
  });

  it('creates SrsCard records for anki section with box/review fields', async () => {
    const cards = await ensureSrsCardsForDay(SAMPLE_DAY, new Date('2026-02-19T10:00:00.000Z'));

    expect(cards).toHaveLength(2);
    expect(cards[0].id).toBe('d31:anki-a:0');
    expect(cards[0].box).toBe(1);
    expect(cards[0].reviewCount).toBe(0);
    expect(cards[0].successCount).toBe(0);
  });

  it('maps Again/Good/Easy to Leitner boxes and persists', async () => {
    await ensureSrsCardsForDay(SAMPLE_DAY, new Date('2026-02-19T10:00:00.000Z'));

    const again = await reviewSrsCard({
      dayNumber: 31,
      sectionId: 'anki-a',
      sentenceIndex: 0,
      sentence: SAMPLE_DAY.sections[0].sentences[0],
      grade: 'again',
      now: new Date('2026-02-19T10:00:00.000Z'),
    });
    expect(again.box).toBe(1);
    expect(again.dueDate).toBe('2026-02-20');

    const good = await reviewSrsCard({
      dayNumber: 31,
      sectionId: 'anki-a',
      sentenceIndex: 0,
      sentence: SAMPLE_DAY.sections[0].sentences[0],
      grade: 'good',
      now: new Date('2026-02-20T10:00:00.000Z'),
    });
    expect(good.box).toBe(2);
    expect(good.dueDate).toBe('2026-02-23');

    const easy = await reviewSrsCard({
      dayNumber: 31,
      sectionId: 'anki-a',
      sentenceIndex: 0,
      sentence: SAMPLE_DAY.sections[0].sentences[0],
      grade: 'easy',
      now: new Date('2026-02-23T10:00:00.000Z'),
    });
    expect(easy.box).toBe(4);
    expect(easy.dueDate).toBe('2026-03-09');
    expect(LEITNER_INTERVALS_DAYS).toEqual([1, 3, 7, 14, 30]);
  });

  it('builds due queue with cap', async () => {
    await ensureSrsCardsForDay(SAMPLE_DAY, new Date('2026-02-19T10:00:00.000Z'));

    const cards = JSON.parse(state['speak90:srs:v1']);
    cards.push({
      ...cards[0],
      id: 'd31:anki-a:99',
      sentenceIndex: 99,
      prompt: 'extra',
      answer: 'extra',
      dueDate: '2026-02-10',
      box: 1,
    });
    cards.push({
      ...cards[0],
      id: 'd31:anki-a:100',
      sentenceIndex: 100,
      prompt: 'future',
      answer: 'future',
      dueDate: '2026-03-10',
      box: 2,
    });
    state['speak90:srs:v1'] = JSON.stringify(cards);

    const due = await loadDueSrsQueue({ date: new Date('2026-02-19T10:00:00.000Z'), cap: 2 });
    expect(due).toHaveLength(2);
    expect(due[0].dueDate).toBe('2026-02-10');

    const fullDue = getDueSrsQueue(cards, { date: new Date('2026-02-19T10:00:00.000Z'), cap: DEFAULT_SRS_DAILY_CAP });
    expect(fullDue.find((card) => card.id === 'd31:anki-a:100')).toBeUndefined();
  });
});
