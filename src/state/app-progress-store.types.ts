import type { SessionDraft } from '../data/session-draft-store';
import type { ReviewMode, UserProgress } from '../data/progress-store';

export type ProgressSlice = {
  progress: UserProgress;
  refreshProgress: () => Promise<void>;
  applyProgressMutation: (mutation: () => Promise<UserProgress>) => Promise<UserProgress>;
  completeSessionAndSync: (params: { completedDay: number; sessionSeconds: number; totalDays: number }) => Promise<UserProgress>;
  completeLightReviewAndSync: () => Promise<UserProgress>;
  completeDeepConsolidationAndSync: () => Promise<UserProgress>;
  completeReinforcementCheckpointAndSync: (checkpointDay: number) => Promise<UserProgress>;
  markReinforcementCheckpointOfferedAndSync: (checkpointDay: number) => Promise<UserProgress>;
  markMicroReviewShownAndSync: () => Promise<UserProgress>;
  markMicroReviewCompletedAndSync: () => Promise<UserProgress>;
  incrementReviewModeCompletionAndSync: (mode: ReviewMode) => Promise<UserProgress>;
};

export type DraftSlice = {
  sessionDraft: SessionDraft | null;
  refreshSessionDraft: () => Promise<void>;
  loadSessionDraftAndSync: () => Promise<SessionDraft | null>;
  saveSessionDraftAndSync: (draft: SessionDraft) => Promise<void>;
  clearSessionDraftAndSync: () => Promise<void>;
};

export type HydrationSlice = {
  isHydrating: boolean;
  hydratedOnce: boolean;
  hydrate: () => Promise<void>;
};

export type AppProgressState = HydrationSlice & ProgressSlice & DraftSlice;

