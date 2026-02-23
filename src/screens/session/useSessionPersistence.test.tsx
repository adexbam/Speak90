import React from 'react';
import { act, create } from 'react-test-renderer';
import type { Day } from '../../data/day-model';
import { useSessionPersistence } from './useSessionPersistence';

const mockSaveSessionDraft = jest.fn();
const mockLoadSessionDraft = jest.fn();
const mockClearSessionDraft = jest.fn();
const mockCompleteSessionAndSave = jest.fn();

jest.mock('../../data/session-draft-store', () => ({
  saveSessionDraft: (...args: unknown[]) => mockSaveSessionDraft(...args),
  loadSessionDraft: (...args: unknown[]) => mockLoadSessionDraft(...args),
  clearSessionDraft: (...args: unknown[]) => mockClearSessionDraft(...args),
}));

jest.mock('../../data/progress-store', () => ({
  completeSessionAndSave: (...args: unknown[]) => mockCompleteSessionAndSave(...args),
}));

type HarnessProps = {
  day?: Day;
  mode?: 'new_day' | 'light_review' | 'deep_consolidation' | 'milestone';
  sectionIndex: number;
  sentenceIndex: number;
  repRound: number;
  remainingSeconds: number;
  sessionElapsedSeconds: number;
  isComplete?: boolean;
  restoreFromDraft: jest.Mock;
  hydrateTimerFromDraft: jest.Mock;
};

let latestHook: ReturnType<typeof useSessionPersistence> | null = null;

function Harness({
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
}: HarnessProps) {
  const section = day?.sections[sectionIndex];
  latestHook = useSessionPersistence({
    mode,
    day,
    section,
    isComplete,
    totalDays: 10,
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

const dayFixture: Day = {
  dayNumber: 1,
  sections: [
    { id: 'warmup', type: 'warmup', title: 'Warmup', sentences: ['a'], reps: 1, duration: 60 },
    { id: 'verbs', type: 'verbs', title: 'Verbs', sentences: ['b'], reps: 1, duration: 180 },
  ],
};

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('useSessionPersistence', () => {
  let renderer: ReturnType<typeof create> | null = null;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    latestHook = null;
    renderer = null;
  });

  afterEach(() => {
    if (renderer) {
      act(() => {
        renderer?.unmount();
      });
    }
    jest.useRealTimers();
  });

  it('hydrates from draft for matching day and restores timer/progression', async () => {
    const restoreFromDraft = jest.fn();
    const hydrateTimerFromDraft = jest.fn();
    mockLoadSessionDraft.mockResolvedValueOnce({
      dayNumber: 1,
      sectionIndex: 1,
      sentenceIndex: 0,
      repRound: 2,
      remainingSeconds: 999,
      sessionElapsedSeconds: 42,
      savedAt: '2026-02-19T00:00:00.000Z',
    });

    act(() => {
      renderer = create(
        <Harness
          day={dayFixture}
          sectionIndex={0}
          sentenceIndex={0}
          repRound={1}
          remainingSeconds={60}
          sessionElapsedSeconds={0}
          restoreFromDraft={restoreFromDraft}
          hydrateTimerFromDraft={hydrateTimerFromDraft}
        />,
      );
    });

    await flush();

    expect(restoreFromDraft).toHaveBeenCalledWith({ sectionIndex: 1, sentenceIndex: 0, repRound: 2 });
    expect(hydrateTimerFromDraft).toHaveBeenCalledWith(180, 42);
    expect(latestHook?.hydratedDraft).toBe(true);
  });

  it('autosaves on cadence buckets and not for every second tick', async () => {
    const restoreFromDraft = jest.fn();
    const hydrateTimerFromDraft = jest.fn();
    mockLoadSessionDraft.mockResolvedValue(null);

    act(() => {
      renderer = create(
        <Harness
          day={dayFixture}
          sectionIndex={0}
          sentenceIndex={0}
          repRound={1}
          remainingSeconds={60}
          sessionElapsedSeconds={0}
          restoreFromDraft={restoreFromDraft}
          hydrateTimerFromDraft={hydrateTimerFromDraft}
        />,
      );
    });

    await flush();
    await act(async () => {
      jest.advanceTimersByTime(450);
    });
    const initialCalls = mockSaveSessionDraft.mock.calls.length;
    expect(initialCalls).toBeGreaterThanOrEqual(1);

    act(() => {
      renderer.update(
        <Harness
          day={dayFixture}
          sectionIndex={0}
          sentenceIndex={0}
          repRound={1}
          remainingSeconds={59}
          sessionElapsedSeconds={1}
          restoreFromDraft={restoreFromDraft}
          hydrateTimerFromDraft={hydrateTimerFromDraft}
        />,
      );
    });
    await act(async () => {
      jest.advanceTimersByTime(450);
    });
    const afterBucketChangeCalls = mockSaveSessionDraft.mock.calls.length;
    expect(afterBucketChangeCalls).toBe(initialCalls + 1);

    act(() => {
      renderer.update(
        <Harness
          day={dayFixture}
          sectionIndex={0}
          sentenceIndex={0}
          repRound={1}
          remainingSeconds={58}
          sessionElapsedSeconds={2}
          restoreFromDraft={restoreFromDraft}
          hydrateTimerFromDraft={hydrateTimerFromDraft}
        />,
      );
    });
    await act(async () => {
      jest.advanceTimersByTime(450);
    });
    expect(mockSaveSessionDraft).toHaveBeenCalledTimes(afterBucketChangeCalls);

    act(() => {
      renderer.update(
        <Harness
          day={dayFixture}
          sectionIndex={0}
          sentenceIndex={0}
          repRound={1}
          remainingSeconds={54}
          sessionElapsedSeconds={5}
          restoreFromDraft={restoreFromDraft}
          hydrateTimerFromDraft={hydrateTimerFromDraft}
        />,
      );
    });
    await act(async () => {
      jest.advanceTimersByTime(450);
    });
    expect(mockSaveSessionDraft).toHaveBeenCalledTimes(afterBucketChangeCalls + 1);
  });

  it('persists completion and clears draft when session completes', async () => {
    const restoreFromDraft = jest.fn();
    const hydrateTimerFromDraft = jest.fn();
    mockLoadSessionDraft.mockResolvedValue(null);
    mockCompleteSessionAndSave.mockResolvedValue({});

    act(() => {
      renderer = create(
        <Harness
          day={dayFixture}
          sectionIndex={0}
          sentenceIndex={0}
          repRound={1}
          remainingSeconds={10}
          sessionElapsedSeconds={100}
          isComplete={false}
          restoreFromDraft={restoreFromDraft}
          hydrateTimerFromDraft={hydrateTimerFromDraft}
        />,
      );
    });

    await flush();

    act(() => {
      renderer.update(
        <Harness
          day={dayFixture}
          sectionIndex={0}
          sentenceIndex={0}
          repRound={1}
          remainingSeconds={0}
          sessionElapsedSeconds={100}
          isComplete
          restoreFromDraft={restoreFromDraft}
          hydrateTimerFromDraft={hydrateTimerFromDraft}
        />,
      );
    });

    await flush();

    expect(mockCompleteSessionAndSave).toHaveBeenCalledWith({
      completedDay: 1,
      sessionSeconds: 100,
      totalDays: 10,
    });
    expect(mockClearSessionDraft).toHaveBeenCalledTimes(1);
    expect(latestHook?.progressSaved).toBe(true);
  });
});
