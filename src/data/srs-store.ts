import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Day } from './day-model';
import { buildAnalyticsPayload, trackEvent } from '../analytics/events';

const SRS_KEY = 'speak90:srs:v1';
export const LEITNER_INTERVALS_DAYS = [1, 3, 7, 14, 30] as const;
export const DEFAULT_SRS_DAILY_CAP = 50;

export type SrsGrade = 'again' | 'good' | 'easy';

export interface SrsCard {
  id: string;
  dayNumber: number;
  sectionId: string;
  sentenceIndex: number;
  prompt: string;
  answer: string;
  box: number;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  lastReviewedAt?: string;
  lastGrade?: SrsGrade;
  reviewCount: number;
  successCount: number;
}

type DueQueueOptions = {
  date?: Date;
  cap?: number;
};

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function parseBilingualPair(sentence: string): { prompt: string; answer: string } {
  const [left, ...rest] = sentence.split('->');
  const prompt = (left ?? '').trim();
  const right = rest.join('->').trim();
  const answer = right || prompt;
  return { prompt: prompt || answer, answer };
}

function sanitizeCard(value: unknown): SrsCard | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const card = value as Partial<SrsCard>;
  const validBox = Number.isInteger(card.box) && (card.box ?? 0) >= 1 && (card.box ?? 0) <= LEITNER_INTERVALS_DAYS.length;
  if (
    typeof card.id !== 'string' ||
    card.id.length === 0 ||
    !Number.isInteger(card.dayNumber) ||
    (card.dayNumber ?? 0) <= 0 ||
    typeof card.sectionId !== 'string' ||
    card.sectionId.length === 0 ||
    !Number.isInteger(card.sentenceIndex) ||
    (card.sentenceIndex ?? -1) < 0 ||
    typeof card.prompt !== 'string' ||
    card.prompt.length === 0 ||
    typeof card.answer !== 'string' ||
    card.answer.length === 0 ||
    !validBox ||
    typeof card.dueDate !== 'string' ||
    card.dueDate.length === 0 ||
    typeof card.createdAt !== 'string' ||
    card.createdAt.length === 0 ||
    typeof card.updatedAt !== 'string' ||
    card.updatedAt.length === 0 ||
    !Number.isInteger(card.reviewCount) ||
    (card.reviewCount ?? -1) < 0 ||
    !Number.isInteger(card.successCount) ||
    (card.successCount ?? -1) < 0
  ) {
    return null;
  }

  return {
    id: card.id,
    dayNumber: card.dayNumber as number,
    sectionId: card.sectionId,
    sentenceIndex: card.sentenceIndex as number,
    prompt: card.prompt,
    answer: card.answer,
    box: card.box as number,
    dueDate: card.dueDate,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
    lastReviewedAt: typeof card.lastReviewedAt === 'string' ? card.lastReviewedAt : undefined,
    lastGrade: card.lastGrade === 'again' || card.lastGrade === 'good' || card.lastGrade === 'easy' ? card.lastGrade : undefined,
    reviewCount: card.reviewCount as number,
    successCount: card.successCount as number,
  };
}

function buildCardId(dayNumber: number, sectionId: string, sentenceIndex: number): string {
  return `d${dayNumber}:${sectionId}:${sentenceIndex}`;
}

function nextBoxForGrade(currentBox: number, grade: SrsGrade): number {
  if (grade === 'again') {
    return 1;
  }
  if (grade === 'easy') {
    return Math.min(LEITNER_INTERVALS_DAYS.length, currentBox + 2);
  }
  return Math.min(LEITNER_INTERVALS_DAYS.length, currentBox + 1);
}

function nextDueDate(now: Date, box: number): string {
  const intervalDays = LEITNER_INTERVALS_DAYS[box - 1] ?? LEITNER_INTERVALS_DAYS[LEITNER_INTERVALS_DAYS.length - 1];
  return toLocalDateKey(addDays(now, intervalDays));
}

export async function loadSrsCards(): Promise<SrsCard[]> {
  const raw = await AsyncStorage.getItem(SRS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map(sanitizeCard).filter((card): card is SrsCard => card !== null);
  } catch {
    return [];
  }
}

export async function saveSrsCards(cards: SrsCard[]): Promise<void> {
  await AsyncStorage.setItem(SRS_KEY, JSON.stringify(cards));
}

export function getDueSrsQueue(cards: SrsCard[], options?: DueQueueOptions): SrsCard[] {
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

export async function loadDueSrsQueue(options?: DueQueueOptions): Promise<SrsCard[]> {
  const cards = await loadSrsCards();
  return getDueSrsQueue(cards, options);
}

export async function ensureSrsCardsForDay(day: Day, now = new Date()): Promise<SrsCard[]> {
  const ankiSection = day.sections.find((section) => section.type === 'anki');
  if (!ankiSection) {
    return loadSrsCards();
  }

  const cards = await loadSrsCards();
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
    await saveSrsCards(cards);
  }
  return cards;
}

export async function reviewSrsCard(params: {
  dayNumber: number;
  sectionId: string;
  sentenceIndex: number;
  sentence: string;
  grade: SrsGrade;
  now?: Date;
}): Promise<SrsCard> {
  const now = params.now ?? new Date();
  const nowIso = now.toISOString();
  const cards = await loadSrsCards();
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

  await saveSrsCards(cards);
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
