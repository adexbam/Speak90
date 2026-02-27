import { useEffect, useState } from 'react';
import { buildAnalyticsPayload, trackEvent } from '../../../analytics/events';
import type { Day } from '../../../data/day-model';
import { loadMilestoneRecordings, type RecordingMetadata } from '../../../data/recordings-store';
import type { SessionDraft } from '../../../data/session-draft-store';
import { useTimedModeController } from './useTimedModeController';

type UseMilestoneControllerParams = {
  day?: Day;
  allDaysCount: number;
  isPracticeMode: boolean;
  isMilestoneMode: boolean;
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
  loadSessionDraftAndSync,
  saveSessionDraftAndSync,
  clearSessionDraftAndSync,
  completeSessionAndSync,
  incrementReviewModeCompletionAndSync,
}: UseMilestoneControllerParams) {
  const [records, setRecords] = useState<RecordingMetadata[]>([]);

  const runtime = useTimedModeController<RecordingMetadata[]>({
    day,
    mode: 'milestone',
    durationSeconds: 600,
    isModeActive: isMilestoneMode,
    loadSessionDraftAndSync,
    saveSessionDraftAndSync,
    clearSessionDraftAndSync,
    loadExtra: loadMilestoneRecordings,
    onHydrated: (milestones) => {
      if (!day) {
        return;
      }
      const previous = milestones.filter((m) => m.dayNumber < day.dayNumber).sort((a, b) => (a.dayNumber < b.dayNumber ? 1 : -1));
      setRecords(previous);
    },
    onPersistComplete:
      isPracticeMode || !day
        ? undefined
        : async () => {
            await completeSessionAndSync({
              completedDay: day.dayNumber,
              sessionSeconds: 600,
              totalDays: allDaysCount,
            });
            await incrementReviewModeCompletionAndSync();
            trackEvent(
              'review_mode_completed',
              buildAnalyticsPayload({
                dayNumber: day.dayNumber,
                sectionId: 'review.milestone',
              }),
            );
          },
  });

  return {
    records,
    remainingSeconds: runtime.remainingSeconds,
    hydrated: runtime.hydrated,
    completed: runtime.completed,
    setCompleted: runtime.setCompleted,
    saved: runtime.saved,
    persistDraftOnClose: runtime.persistDraftOnClose,
  };
}
