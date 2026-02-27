import { DEFAULT_SRS_DAILY_CAP, LEITNER_INTERVALS_DAYS } from './srs-store.constants';
import { loadSrsCardRecords, saveSrsCardRecords } from './srs-store.repository';
import { ensureCardsForDay, getDueQueue, loadDueQueue, reviewCard } from './srs-store.service';
import type { Day } from './day-model';
import type { DueQueueOptions, SrsCard, SrsGrade } from './srs-store.types';

export { DEFAULT_SRS_DAILY_CAP, LEITNER_INTERVALS_DAYS };
export type { DueQueueOptions, SrsCard, SrsGrade } from './srs-store.types';

export async function loadSrsCards() {
  return loadSrsCardRecords();
}

export async function saveSrsCards(cards: SrsCard[]): Promise<void> {
  await saveSrsCardRecords(cards);
}

export function getDueSrsQueue(cards: SrsCard[], options?: DueQueueOptions) {
  return getDueQueue(cards, options);
}

export async function loadDueSrsQueue(options?: DueQueueOptions) {
  return loadDueQueue(options);
}

export async function ensureSrsCardsForDay(day: Day, now = new Date()) {
  return ensureCardsForDay(day, now);
}

export async function reviewSrsCard(params: {
  dayNumber: number;
  sectionId: string;
  sentenceIndex: number;
  sentence: string;
  grade: SrsGrade;
  now?: Date;
}) {
  return reviewCard(params);
}
