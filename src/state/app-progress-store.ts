import { create } from 'zustand';
import {
  completeDeepConsolidationAndSave,
  completeLightReviewAndSave,
  completeReinforcementCheckpointAndSave,
  completeSessionAndSave,
  incrementReviewModeCompletionAndSave,
  loadUserProgress,
  markMicroReviewCompletedAndSave,
  markMicroReviewShownAndSave,
  markReinforcementCheckpointOfferedAndSave,
  type ReviewMode,
  type ReviewModeCompletionCounts,
  type UserProgress,
} from '../data/progress-store';
import {
  clearSessionDraft,
  loadSessionDraft,
  saveSessionDraft,
  type SessionDraft,
} from '../data/session-draft-store';

const EMPTY_REVIEW_COUNTS: ReviewModeCompletionCounts = {
  new_day: 0,
  light_review: 0,
  deep_consolidation: 0,
  milestone: 0,
};

const EMPTY_PROGRESS: UserProgress = {
  currentDay: 1,
  streak: 0,
  sessionsCompleted: [],
  totalMinutes: 0,
  reviewModeCompletionCounts: EMPTY_REVIEW_COUNTS,
};

type AppProgressState = {
  progress: UserProgress;
  sessionDraft: SessionDraft | null;
  isHydrating: boolean;
  hydratedOnce: boolean;
  hydrate: () => Promise<void>;
  refreshProgress: () => Promise<void>;
  applyProgressMutation: (mutation: () => Promise<UserProgress>) => Promise<UserProgress>;
  refreshSessionDraft: () => Promise<void>;
  loadSessionDraftAndSync: () => Promise<SessionDraft | null>;
  saveSessionDraftAndSync: (draft: SessionDraft) => Promise<void>;
  clearSessionDraftAndSync: () => Promise<void>;
  completeSessionAndSync: (params: { completedDay: number; sessionSeconds: number; totalDays: number }) => Promise<UserProgress>;
  completeLightReviewAndSync: () => Promise<UserProgress>;
  completeDeepConsolidationAndSync: () => Promise<UserProgress>;
  completeReinforcementCheckpointAndSync: (checkpointDay: number) => Promise<UserProgress>;
  markReinforcementCheckpointOfferedAndSync: (checkpointDay: number) => Promise<UserProgress>;
  markMicroReviewShownAndSync: () => Promise<UserProgress>;
  markMicroReviewCompletedAndSync: () => Promise<UserProgress>;
  incrementReviewModeCompletionAndSync: (mode: ReviewMode) => Promise<UserProgress>;
};

let draftWriteQueue: Promise<unknown> = Promise.resolve();
let progressWriteQueue: Promise<unknown> = Promise.resolve();

export const useAppProgressStore = create<AppProgressState>((set) => ({
  progress: EMPTY_PROGRESS,
  sessionDraft: null,
  isHydrating: false,
  hydratedOnce: false,
  hydrate: async () => {
    set({ isHydrating: true });
    try {
      const [progress, sessionDraft] = await Promise.all([loadUserProgress(), loadSessionDraft()]);
      set({
        progress,
        sessionDraft,
        hydratedOnce: true,
      });
    } finally {
      set({ isHydrating: false });
    }
  },
  refreshProgress: async () => {
    const progress = await loadUserProgress();
    set({ progress });
  },
  applyProgressMutation: async (mutation) => {
    const run: Promise<UserProgress> = progressWriteQueue.then(async () => {
      const progress = await mutation();
      set({ progress });
      return progress;
    }) as Promise<UserProgress>;
    progressWriteQueue = run.catch(() => undefined);
    return run;
  },
  refreshSessionDraft: async () => {
    const sessionDraft = await loadSessionDraft();
    set({ sessionDraft });
  },
  loadSessionDraftAndSync: async () => {
    const sessionDraft = await loadSessionDraft();
    set({ sessionDraft });
    return sessionDraft;
  },
  saveSessionDraftAndSync: async (draft) => {
    const run = draftWriteQueue.then(async () => {
      await saveSessionDraft(draft);
      set({ sessionDraft: draft });
    });
    draftWriteQueue = run.catch(() => undefined);
    await run;
  },
  clearSessionDraftAndSync: async () => {
    const run = draftWriteQueue.then(async () => {
      await clearSessionDraft();
      set({ sessionDraft: null });
    });
    draftWriteQueue = run.catch(() => undefined);
    await run;
  },
  completeSessionAndSync: async (params) => {
    const run: Promise<UserProgress> = progressWriteQueue.then(async () => {
      const progress = await completeSessionAndSave(params);
      set({ progress });
      return progress;
    }) as Promise<UserProgress>;
    progressWriteQueue = run.catch(() => undefined);
    return run;
  },
  completeLightReviewAndSync: async () => {
    const run: Promise<UserProgress> = progressWriteQueue.then(async () => {
      const progress = await completeLightReviewAndSave();
      set({ progress });
      return progress;
    }) as Promise<UserProgress>;
    progressWriteQueue = run.catch(() => undefined);
    return run;
  },
  completeDeepConsolidationAndSync: async () => {
    const run: Promise<UserProgress> = progressWriteQueue.then(async () => {
      const progress = await completeDeepConsolidationAndSave();
      set({ progress });
      return progress;
    }) as Promise<UserProgress>;
    progressWriteQueue = run.catch(() => undefined);
    return run;
  },
  completeReinforcementCheckpointAndSync: async (checkpointDay) => {
    const run: Promise<UserProgress> = progressWriteQueue.then(async () => {
      const progress = await completeReinforcementCheckpointAndSave(checkpointDay);
      set({ progress });
      return progress;
    }) as Promise<UserProgress>;
    progressWriteQueue = run.catch(() => undefined);
    return run;
  },
  markReinforcementCheckpointOfferedAndSync: async (checkpointDay) => {
    const run: Promise<UserProgress> = progressWriteQueue.then(async () => {
      const progress = await markReinforcementCheckpointOfferedAndSave(checkpointDay);
      set({ progress });
      return progress;
    }) as Promise<UserProgress>;
    progressWriteQueue = run.catch(() => undefined);
    return run;
  },
  markMicroReviewShownAndSync: async () => {
    const run: Promise<UserProgress> = progressWriteQueue.then(async () => {
      const progress = await markMicroReviewShownAndSave();
      set({ progress });
      return progress;
    }) as Promise<UserProgress>;
    progressWriteQueue = run.catch(() => undefined);
    return run;
  },
  markMicroReviewCompletedAndSync: async () => {
    const run: Promise<UserProgress> = progressWriteQueue.then(async () => {
      const progress = await markMicroReviewCompletedAndSave();
      set({ progress });
      return progress;
    }) as Promise<UserProgress>;
    progressWriteQueue = run.catch(() => undefined);
    return run;
  },
  incrementReviewModeCompletionAndSync: async (mode) => {
    const run: Promise<UserProgress> = progressWriteQueue.then(async () => {
      const progress = await incrementReviewModeCompletionAndSave(mode);
      set({ progress });
      return progress;
    }) as Promise<UserProgress>;
    progressWriteQueue = run.catch(() => undefined);
    return run;
  },
}));
