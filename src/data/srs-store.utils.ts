import { LEITNER_INTERVALS_DAYS } from './srs-store.constants';
import type { SrsCard, SrsGrade } from './srs-store.types';

export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function parseBilingualPair(sentence: string): { prompt: string; answer: string } {
  const [left, ...rest] = sentence.split('->');
  const prompt = (left ?? '').trim();
  const right = rest.join('->').trim();
  const answer = right || prompt;
  return { prompt: prompt || answer, answer };
}

export function sanitizeCard(value: unknown): SrsCard | null {
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

export function buildCardId(dayNumber: number, sectionId: string, sentenceIndex: number): string {
  return `d${dayNumber}:${sectionId}:${sentenceIndex}`;
}

export function nextBoxForGrade(currentBox: number, grade: SrsGrade): number {
  if (grade === 'again') {
    return 1;
  }
  if (grade === 'easy') {
    return Math.min(LEITNER_INTERVALS_DAYS.length, currentBox + 2);
  }
  return Math.min(LEITNER_INTERVALS_DAYS.length, currentBox + 1);
}

export function nextDueDate(now: Date, box: number): string {
  const intervalDays = LEITNER_INTERVALS_DAYS[box - 1] ?? LEITNER_INTERVALS_DAYS[LEITNER_INTERVALS_DAYS.length - 1];
  return toLocalDateKey(addDays(now, intervalDays));
}
