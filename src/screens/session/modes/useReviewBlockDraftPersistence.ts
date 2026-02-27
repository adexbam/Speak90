import { useCallback, useEffect, useState } from 'react';
import type { Day } from '../../../data/day-model';
import type { SessionDraft } from '../../../data/session-draft-store';
import { useModeDraftAutosave } from './useModeDraftAutosave';

type ReviewBlock = {
  durationMinutes?: number;
};

type UseReviewBlockDraftPersistenceParams = {
  day?: Day;
  mode: 'light_review' | 'deep_consolidation';
  isModeActive: boolean;
  blocks: ReviewBlock[];
  fallbackMinutes: number;
  blockIndex: number;
  setBlockIndex: (next: number) => void;
  remainingSeconds: number;
  setRemainingSeconds: (next: number) => void;
  sessionElapsedSeconds: number;
  setSessionElapsedSeconds: (next: number) => void;
  completed: boolean;
  setCompleted: (next: boolean) => void;
  setSaved: (next: boolean) => void;
  loadSessionDraftAndSync: () => Promise<SessionDraft | null>;
  saveSessionDraftAndSync: (draft: SessionDraft) => Promise<void>;
};

export function useReviewBlockDraftPersistence({
  day,
  mode,
  isModeActive,
  blocks,
  fallbackMinutes,
  blockIndex,
  setBlockIndex,
  remainingSeconds,
  setRemainingSeconds,
  sessionElapsedSeconds,
  setSessionElapsedSeconds,
  completed,
  setCompleted,
  setSaved,
  loadSessionDraftAndSync,
  saveSessionDraftAndSync,
}: UseReviewBlockDraftPersistenceParams) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!isModeActive || !day) {
      setHydrated(true);
      return;
    }

    let active = true;
    const hydrate = async () => {
      const draft = await loadSessionDraftAndSync();
      if (!active) return;

      const firstBlockDuration = (blocks[0]?.durationMinutes ?? fallbackMinutes) * 60;
      if (draft && draft.dayNumber === day.dayNumber && (draft.mode ?? 'new_day') === mode) {
        const safeBlockIndex = Math.min(Math.max(0, draft.sectionIndex), Math.max(0, blocks.length - 1));
        const safeBlockDuration = (blocks[safeBlockIndex]?.durationMinutes ?? fallbackMinutes) * 60;
        setBlockIndex(safeBlockIndex);
        setRemainingSeconds(Math.min(draft.remainingSeconds, safeBlockDuration));
        setSessionElapsedSeconds(draft.sessionElapsedSeconds);
      } else {
        setBlockIndex(0);
        setRemainingSeconds(firstBlockDuration);
        setSessionElapsedSeconds(0);
      }
      setCompleted(false);
      setSaved(false);
      setHydrated(true);
    };
    void hydrate();
    return () => {
      active = false;
    };
  }, [
    blocks,
    day,
    fallbackMinutes,
    isModeActive,
    loadSessionDraftAndSync,
    mode,
    setBlockIndex,
    setCompleted,
    setRemainingSeconds,
    setSaved,
    setSessionElapsedSeconds,
  ]);

  const persistDraftOnClose = useCallback(async () => {
    if (!isModeActive || !hydrated || completed || !day) {
      return;
    }
    await saveSessionDraftAndSync({
      dayNumber: day.dayNumber,
      mode,
      sectionIndex: blockIndex,
      sentenceIndex: 0,
      remainingSeconds,
      sessionElapsedSeconds,
      savedAt: new Date().toISOString(),
    });
  }, [blockIndex, completed, day, hydrated, isModeActive, mode, remainingSeconds, saveSessionDraftAndSync, sessionElapsedSeconds]);

  const autosaveKey = blockIndex * 100000 + Math.floor(remainingSeconds / 5) * 100 + Math.floor(sessionElapsedSeconds / 5);
  useModeDraftAutosave({
    enabled: isModeActive && hydrated && !completed && !!day,
    save: persistDraftOnClose,
    dependencyKey: autosaveKey,
  });

  return {
    hydrated,
    persistDraftOnClose,
  };
}

