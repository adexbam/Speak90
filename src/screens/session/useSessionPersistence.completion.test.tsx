import React from 'react';
import { act, create } from 'react-test-renderer';
import {
  mockClearSessionDraftAndSync,
  mockCompleteSessionAndSync,
  resetSessionPersistenceTestMocks,
} from './useSessionPersistence.test-setup';
import {
  SessionPersistenceHarness,
  dayFixture,
  getLatestSessionPersistenceHook,
} from './useSessionPersistence.test-harness';

describe('useSessionPersistence completion', () => {
  let renderer: ReturnType<typeof create> | null = null;

  beforeEach(() => {
    resetSessionPersistenceTestMocks();
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

  it('persists completion and clears draft when session completes', async () => {
    const restoreFromDraft = jest.fn();
    const hydrateTimerFromDraft = jest.fn();

    act(() => {
      renderer = create(
        <SessionPersistenceHarness
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

    await flushMicrotasks();

    act(() => {
      renderer?.update(
        <SessionPersistenceHarness
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

    await flushMicrotasks();

    expect(mockCompleteSessionAndSync).toHaveBeenCalledWith({
      completedDay: 1,
      sessionSeconds: 100,
      totalDays: 10,
    });
    expect(mockClearSessionDraftAndSync).toHaveBeenCalledTimes(1);
    expect(getLatestSessionPersistenceHook()?.progressSaved).toBe(true);
  });
});
  async function flushMicrotasks() {
    await act(async () => {
      await Promise.resolve();
    });
  }

