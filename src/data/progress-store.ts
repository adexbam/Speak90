import { loadProgressRecord, saveProgressRecord } from './progress-store.repository';
import {
  completeDeepConsolidation,
  completeLightReview,
  completeReinforcementCheckpoint,
  completeSession,
  incrementReviewModeCompletion,
  markMicroReviewCompleted,
  markMicroReviewShown,
  markReinforcementCheckpointOffered,
} from './progress-store.service';
import type { ReviewMode, UserProgress } from './progress-store.types';

export type { ReviewMode, ReviewModeCompletionCounts, UserProgress } from './progress-store.types';

export async function loadUserProgress() {
  return loadProgressRecord();
}

export async function saveUserProgress(progress: UserProgress): Promise<void> {
  await saveProgressRecord(progress);
}

/**
 * Streak + progression rules:
 * - Completing multiple sessions on the same local day does not increase streak twice.
 * - If previous completion date was yesterday, streak increments by 1.
 * - Otherwise, streak resets to 1.
 * - `currentDay` advances only when the completed session matches `currentDay`.
 */
export async function completeSessionAndSave(params: {
  completedDay: number;
  sessionSeconds: number;
  totalDays: number;
}) {
  return completeSession(params);
}

export async function completeLightReviewAndSave(date = new Date()) {
  return completeLightReview(date);
}

export async function completeDeepConsolidationAndSave(date = new Date()) {
  return completeDeepConsolidation(date);
}

export async function completeReinforcementCheckpointAndSave(checkpointDay: number) {
  return completeReinforcementCheckpoint(checkpointDay);
}

export async function markReinforcementCheckpointOfferedAndSave(checkpointDay: number) {
  return markReinforcementCheckpointOffered(checkpointDay);
}

export async function markMicroReviewShownAndSave(date = new Date()) {
  return markMicroReviewShown(date);
}

export async function markMicroReviewCompletedAndSave(date = new Date()) {
  return markMicroReviewCompleted(date);
}

export async function incrementReviewModeCompletionAndSave(mode: ReviewMode) {
  return incrementReviewModeCompletion(mode);
}
