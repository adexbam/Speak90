import { create } from 'zustand';
import {
  loadUserProgress,
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
  refreshSessionDraft: () => Promise<void>;
  saveSessionDraftAndSync: (draft: SessionDraft) => Promise<void>;
  clearSessionDraftAndSync: () => Promise<void>;
};

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
  refreshSessionDraft: async () => {
    const sessionDraft = await loadSessionDraft();
    set({ sessionDraft });
  },
  saveSessionDraftAndSync: async (draft) => {
    await saveSessionDraft(draft);
    set({ sessionDraft: draft });
  },
  clearSessionDraftAndSync: async () => {
    await clearSessionDraft();
    set({ sessionDraft: null });
  },
}));

