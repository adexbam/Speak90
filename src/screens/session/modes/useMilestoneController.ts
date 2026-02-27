import { useCallback, useEffect, useState } from 'react';
import { buildAnalyticsPayload, trackEvent } from '../../../analytics/events';
import type { Day } from '../../../data/day-model';
import { loadMilestoneRecordings, type RecordingMetadata } from '../../../data/recordings-store';
import type { SessionDraft } from '../../../data/session-draft-store';
import { useModeCountdown } from './useModeCountdown';
import { useModeDraftAutosave } from './useModeDraftAutosave';

type UseMilestoneControllerParams = {
  day?: Day;
  allDaysCount: number;
  isPracticeMode: boolean;
  isMilestoneMode: boolean;
  hasLastRecording: boolean;
  loadSessionDraftAndSync: () => Promise<SessionDraft | null>;
  saveSessionDraftAndSync: (draft: SessionDraft) => Promise<void>;
  clearSessionDraftAndSync: () => Promise<void>;
  completeSessionAndSync: (params: { completedDay: number; sessionSeconds: number; totalDays: number }) => Promise<unknown>;
  incrementReviewModeCompletionAndSync: () => Promise<unknown>;
};

export function useMilestoneController({
  day,
  allDaysCount,
  isPracticeMode,
  isMilestoneMode,
  hasLastRecording,
  loadSessionDraftAndSync,
  saveSessionDraftAndSync,
  clearSessionDraftAndSync,
  completeSessionAndSync,
  incrementReviewModeCompletionAndSync,
}: UseMilestoneControllerParams) {
  const [records, setRecords] = useState<RecordingMetadata[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState(600);
  const [hydrated, setHydrated] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isMilestoneMode || !day) {
      setHydrated(true);
      return;
    }
    let active = true;
    const hydrate = async () => {
      const [draft, milestones] = await Promise.all([loadSessionDraftAndSync(), loadMilestoneRecordings()]);
      if (!active) return;
      const previous = milestones.filter((m) => m.dayNumber < day.dayNumber).sort((a, b) => (a.dayNumber < b.dayNumber ? 1 : -1));
      setRecords(previous);
      if (draft && draft.dayNumber === day.dayNumber && (draft.mode ?? 'new_day') === 'milestone') {
        setRemainingSeconds(Math.min(600, Math.max(0, draft.remainingSeconds)));
      } else {
        setRemainingSeconds(600);
      }
      setCompleted(false);
      setSaved(false);
      setHydrated(true);
    };
    void hydrate();
    return () => {
      active = false;
    };
  }, [day, isMilestoneMode, hasLastRecording, loadSessionDraftAndSync]);

  const tick = useCallback(() => {
    setRemainingSeconds((prev) => (prev <= 0 ? 0 : prev - 1));
  }, []);
  useModeCountdown({
    enabled: isMilestoneMode && hydrated && !completed,
    onTick: tick,
  });

  const saveDraft = useCallback(async () => {
    if (!isMilestoneMode || !hydrated || completed || !day) {
      return;
    }
      void saveSessionDraftAndSync({
        dayNumber: day.dayNumber,
        mode: 'milestone',
        sectionIndex: 0,
        sentenceIndex: 0,
        remainingSeconds,
        sessionElapsedSeconds: 600 - remainingSeconds,
        savedAt: new Date().toISOString(),
      });
  }, [isMilestoneMode, hydrated, completed, day, remainingSeconds, saveSessionDraftAndSync]);
  useModeDraftAutosave({
    enabled: isMilestoneMode && hydrated && !completed && !!day,
    save: saveDraft,
    dependencyKey: Math.floor(remainingSeconds / 5),
  });

  useEffect(() => {
    if (!isMilestoneMode || !hydrated || completed || remainingSeconds > 0) return;
    setCompleted(true);
  }, [isMilestoneMode, hydrated, completed, remainingSeconds]);

  useEffect(() => {
    if (!isMilestoneMode || !completed) return;
    void clearSessionDraftAndSync();
  }, [isMilestoneMode, completed, clearSessionDraftAndSync]);

  useEffect(() => {
    if (isPracticeMode || !isMilestoneMode || !completed || saved) return;
    let active = true;
    const persist = async () => {
      if (day) {
        await completeSessionAndSync({
          completedDay: day.dayNumber,
          sessionSeconds: 600,
          totalDays: allDaysCount,
        });
      }
      await incrementReviewModeCompletionAndSync();
      trackEvent(
        'review_mode_completed',
        buildAnalyticsPayload({
          dayNumber: day?.dayNumber ?? 1,
          sectionId: 'review.milestone',
        }),
      );
      if (active) setSaved(true);
    };
    void persist();
    return () => {
      active = false;
    };
  }, [isPracticeMode, isMilestoneMode, completed, saved, day, allDaysCount, completeSessionAndSync, incrementReviewModeCompletionAndSync]);

  return {
    records,
    remainingSeconds,
    hydrated,
    completed,
    setCompleted,
    saved,
    persistDraftOnClose: async () => {
      if (!day || completed || !hydrated) return;
      await saveSessionDraftAndSync({
        dayNumber: day.dayNumber,
        mode: 'milestone',
        sectionIndex: 0,
        sentenceIndex: 0,
        remainingSeconds,
        sessionElapsedSeconds: 600 - remainingSeconds,
        savedAt: new Date().toISOString(),
      });
    },
  };
}
