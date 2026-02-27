import React from 'react';
import type { Day } from '../../data/day-model';
import { useSessionPersistence } from './useSessionPersistence';

export type SessionMode = 'new_day' | 'light_review' | 'deep_consolidation' | 'milestone';

export type SessionPersistenceHarnessProps = {
  day?: Day;
  mode?: SessionMode;
  sectionIndex: number;
  sentenceIndex: number;
  repRound: number;
  remainingSeconds: number;
  sessionElapsedSeconds: number;
  isComplete?: boolean;
  restoreFromDraft: jest.Mock;
  hydrateTimerFromDraft: jest.Mock;
  totalDays?: number;
};

let latestHook: ReturnType<typeof useSessionPersistence> | null = null;

export function getLatestSessionPersistenceHook() {
  return latestHook;
}

export function SessionPersistenceHarness({
  day,
  mode = 'new_day',
  sectionIndex,
  sentenceIndex,
  repRound,
  remainingSeconds,
  sessionElapsedSeconds,
  isComplete = false,
  restoreFromDraft,
  hydrateTimerFromDraft,
  totalDays = 10,
}: SessionPersistenceHarnessProps) {
  const section = day?.sections[sectionIndex];
  latestHook = useSessionPersistence({
    mode,
    day,
    section,
    isComplete,
    totalDays,
    sectionIndex,
    sentenceIndex,
    repRound,
    remainingSeconds,
    sessionElapsedSeconds,
    restoreFromDraft,
    hydrateTimerFromDraft,
  });
  return null;
}

export const dayFixture: Day = {
  dayNumber: 1,
  sections: [
    { id: 'warmup', type: 'warmup', title: 'Warmup', sentences: ['a'], reps: 1, duration: 60 },
    { id: 'verbs', type: 'verbs', title: 'Verbs', sentences: ['b'], reps: 1, duration: 180 },
  ],
};

