import type { Day } from './day-model';
import { buildAnalyticsPayload, trackEvent } from '../analytics/events';
import { DEFAULT_SRS_DAILY_CAP } from './srs-store.constants';
import { loadSrsCardRecords, saveSrsCardRecords } from './srs-store.repository';
import { buildCardId, nextBoxForGrade, nextDueDate, parseBilingualPair, toLocalDateKey } from './srs-store.utils';
import type { DueQueueOptions, SrsCard, SrsGrade } from './srs-store.types';

export function getDueQueue(cards: SrsCard[], options?: DueQueueOptions): SrsCard[] {
  const date = options?.date ?? new Date();
  const cap = options?.cap ?? DEFAULT_SRS_DAILY_CAP;
  const today = toLocalDateKey(date);

  return cards
    .filter((card) => card.dueDate <= today)
    .sort((a, b) => {
      if (a.dueDate !== b.dueDate) {
        return a.dueDate < b.dueDate ? -1 : 1;
      }
      if (a.box !== b.box) {
        return a.box - b.box;
      }
      return a.id.localeCompare(b.id);
    })
    .slice(0, Math.max(0, cap));
}

export async function loadDueQueue(options?: DueQueueOptions): Promise<SrsCard[]> {
  const cards = await loadSrsCardRecords();
  return getDueQueue(cards, options);
}

export async function ensureCardsForDay(day: Day, now = new Date()): Promise<SrsCard[]> {
  const ankiSection = day.sections.find((section) => section.type === 'anki');
  if (!ankiSection) {
    return loadSrsCardRecords();
  }

  const cards = await loadSrsCardRecords();
  const cardById = new Map(cards.map((card) => [card.id, card]));
  const today = toLocalDateKey(now);
  const nowIso = now.toISOString();
  let changed = false;

  ankiSection.sentences.forEach((sentence, sentenceIndex) => {
    const id = buildCardId(day.dayNumber, ankiSection.id, sentenceIndex);
    if (cardById.has(id)) {
      return;
    }

    const pair = parseBilingualPair(sentence);
    const created: SrsCard = {
      id,
      dayNumber: day.dayNumber,
      sectionId: ankiSection.id,
      sentenceIndex,
      prompt: pair.prompt,
      answer: pair.answer,
      box: 1,
      dueDate: today,
      createdAt: nowIso,
      updatedAt: nowIso,
      reviewCount: 0,
      successCount: 0,
    };
    cards.push(created);
    changed = true;
  });

  if (changed) {
    await saveSrsCardRecords(cards);
  }
  return cards;
}

export async function reviewCard(params: {
  dayNumber: number;
  sectionId: string;
  sentenceIndex: number;
  sentence: string;
  grade: SrsGrade;
  now?: Date;
}): Promise<SrsCard> {
  const now = params.now ?? new Date();
  const nowIso = now.toISOString();
  const cards = await loadSrsCardRecords();
  const id = buildCardId(params.dayNumber, params.sectionId, params.sentenceIndex);
  const index = cards.findIndex((card) => card.id === id);

  const existing = index >= 0 ? cards[index] : null;
  const parsed = parseBilingualPair(params.sentence);
  const currentBox = existing?.box ?? 1;
  const box = nextBoxForGrade(currentBox, params.grade);

  const nextCard: SrsCard = {
    id,
    dayNumber: params.dayNumber,
    sectionId: params.sectionId,
    sentenceIndex: params.sentenceIndex,
    prompt: parsed.prompt,
    answer: parsed.answer,
    box,
    dueDate: nextDueDate(now, box),
    createdAt: existing?.createdAt ?? nowIso,
    updatedAt: nowIso,
    lastReviewedAt: nowIso,
    lastGrade: params.grade,
    reviewCount: (existing?.reviewCount ?? 0) + 1,
    successCount: (existing?.successCount ?? 0) + (params.grade === 'again' ? 0 : 1),
  };

  if (index >= 0) {
    cards[index] = nextCard;
  } else {
    cards.push(nextCard);
  }

  await saveSrsCardRecords(cards);
  trackEvent(
    'card_reviewed',
    buildAnalyticsPayload(
      {
        dayNumber: params.dayNumber,
        sectionId: params.sectionId,
      },
      {
        grade: params.grade,
        previousBox: currentBox,
        nextBox: box,
      },
    ),
  );
  return nextCard;
}
