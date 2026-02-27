import type { StateCreator } from 'zustand';
import {
  clearSessionDraft,
  loadSessionDraft,
  saveSessionDraft,
  type SessionDraft,
} from '../data/session-draft-store';
import type { AppProgressState, DraftSlice } from './app-progress-store.types';

export type DraftQueueRunner = <T>(task: () => Promise<T>) => Promise<T>;

type DraftSliceOptions = {
  runDraftTask: DraftQueueRunner;
};

export const createDraftSlice =
  ({ runDraftTask }: DraftSliceOptions): StateCreator<AppProgressState, [], [], DraftSlice> =>
  (set) => ({
    sessionDraft: null,
    refreshSessionDraft: async () => {
      const sessionDraft = await loadSessionDraft();
      set({ sessionDraft });
    },
    loadSessionDraftAndSync: async () => {
      const sessionDraft = await loadSessionDraft();
      set({ sessionDraft });
      return sessionDraft;
    },
    saveSessionDraftAndSync: async (draft: SessionDraft) => {
      await runDraftTask(async () => {
        await saveSessionDraft(draft);
        set({ sessionDraft: draft });
      });
    },
    clearSessionDraftAndSync: async () => {
      await runDraftTask(async () => {
        await clearSessionDraft();
        set({ sessionDraft: null });
      });
    },
  });

