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

export type DueQueueOptions = {
  date?: Date;
  cap?: number;
};
