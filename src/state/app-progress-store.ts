import { create } from 'zustand';
import { loadUserProgress } from '../data/progress-store';
import { loadSessionDraft } from '../data/session-draft-store';
import { createDraftSlice } from './app-progress-store.draft-slice';
import { createProgressSlice, EMPTY_PROGRESS } from './app-progress-store.progress-slice';
import type { AppProgressState } from './app-progress-store.types';

let progressWriteQueue = Promise.resolve();
let draftWriteQueue = Promise.resolve();

export const useAppProgressStore = create<AppProgressState>((set, get, api) => ({
  ...createProgressSlice({
    runProgressTask: async <T>(task: () => Promise<T>) => {
      const run = progressWriteQueue.then(task);
      progressWriteQueue = run.then(
        () => undefined,
        () => undefined,
      );
      return run;
    },
  })(set, get, api),
  ...createDraftSlice({
    runDraftTask: async <T>(task: () => Promise<T>) => {
      const run = draftWriteQueue.then(task);
      draftWriteQueue = run.then(
        () => undefined,
        () => undefined,
      );
      return run;
    },
  })(set, get, api),
  progress: EMPTY_PROGRESS,
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
}));
