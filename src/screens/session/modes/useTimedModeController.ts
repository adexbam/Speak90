import { useCallback, useEffect, useState } from 'react';
import type { Day } from '../../../data/day-model';
import type { SessionDraft } from '../../../data/session-draft-store';
import { useModeCountdown } from './useModeCountdown';
import { useModeDraftAutosave } from './useModeDraftAutosave';

type TimedMode = 'milestone';

type UseTimedModeControllerParams<TExtra> = {
  day?: Day;
  mode: TimedMode;
  durationSeconds: number;
  isModeActive: boolean;
  loadSessionDraftAndSync: () => Promise<SessionDraft | null>;
  saveSessionDraftAndSync: (draft: SessionDraft) => Promise<void>;
  clearSessionDraftAndSync: () => Promise<void>;
  loadExtra?: () => Promise<TExtra>;
  onHydrated?: (extra: TExtra) => void;
  onPersistComplete?: () => Promise<void>;
};

export function useTimedModeController<TExtra = void>({
  day,
  mode,
  durationSeconds,
  isModeActive,
  loadSessionDraftAndSync,
  saveSessionDraftAndSync,
  clearSessionDraftAndSync,
  loadExtra,
  onHydrated,
  onPersistComplete,
}: UseTimedModeControllerParams<TExtra>) {
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
  const [hydrated, setHydrated] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isModeActive || !day) {
      setHydrated(true);
      return;
    }

    let active = true;
    const hydrate = async () => {
      const [draft, extra] = await Promise.all([
        loadSessionDraftAndSync(),
        loadExtra ? loadExtra() : Promise.resolve(undefined as TExtra),
      ]);
      if (!active) return;

      if (onHydrated && extra !== undefined) {
        onHydrated(extra);
      }

      if (draft && draft.dayNumber === day.dayNumber && (draft.mode ?? 'new_day') === mode) {
        setRemainingSeconds(Math.min(durationSeconds, Math.max(0, draft.remainingSeconds)));
      } else {
        setRemainingSeconds(durationSeconds);
      }
      setCompleted(false);
      setSaved(false);
      setHydrated(true);
    };
    void hydrate();
    return () => {
      active = false;
    };
  }, [day, durationSeconds, isModeActive, loadExtra, loadSessionDraftAndSync, mode, onHydrated]);

  const tick = useCallback(() => {
    setRemainingSeconds((prev) => (prev <= 0 ? 0 : prev - 1));
  }, []);
  useModeCountdown({
    enabled: isModeActive && hydrated && !completed,
    onTick: tick,
  });

  const persistDraftOnClose = useCallback(async () => {
    if (!day || completed || !hydrated) return;
    await saveSessionDraftAndSync({
      dayNumber: day.dayNumber,
      mode,
      sectionIndex: 0,
      sentenceIndex: 0,
      remainingSeconds,
      sessionElapsedSeconds: durationSeconds - remainingSeconds,
      savedAt: new Date().toISOString(),
    });
  }, [completed, day, durationSeconds, hydrated, mode, remainingSeconds, saveSessionDraftAndSync]);

  useModeDraftAutosave({
    enabled: isModeActive && hydrated && !completed && !!day,
    save: persistDraftOnClose,
    dependencyKey: Math.floor(remainingSeconds / 5),
  });

  useEffect(() => {
    if (!isModeActive || !hydrated || completed || remainingSeconds > 0) return;
    setCompleted(true);
  }, [isModeActive, hydrated, completed, remainingSeconds]);

  useEffect(() => {
    if (!isModeActive || !completed) return;
    void clearSessionDraftAndSync();
  }, [isModeActive, completed, clearSessionDraftAndSync]);

  useEffect(() => {
    if (!isModeActive || !completed || saved || !onPersistComplete) return;
    let active = true;
    const persist = async () => {
      await onPersistComplete();
      if (active) {
        setSaved(true);
      }
    };
    void persist();
    return () => {
      active = false;
    };
  }, [completed, isModeActive, onPersistComplete, saved]);

  return {
    remainingSeconds,
    hydrated,
    completed,
    setCompleted,
    saved,
    persistDraftOnClose,
  };
}
