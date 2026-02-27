import React from 'react';
import { act, create } from 'react-test-renderer';
import {
  mockSaveSessionDraftAndSync,
  resetSessionPersistenceTestMocks,
} from './useSessionPersistence.test-setup';
import { SessionPersistenceHarness, dayFixture } from './useSessionPersistence.test-harness';

describe('useSessionPersistence autosave', () => {
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

  it('autosaves on cadence buckets and not for every second tick', async () => {
    const restoreFromDraft = jest.fn();
    const hydrateTimerFromDraft = jest.fn();

    act(() => {
      renderer = create(
        <SessionPersistenceHarness
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

    await flushMicrotasks();
    await act(async () => {
      jest.advanceTimersByTime(450);
    });
    const initialCalls = mockSaveSessionDraftAndSync.mock.calls.length;
    expect(initialCalls).toBeGreaterThanOrEqual(1);

    act(() => {
      renderer?.update(
        <SessionPersistenceHarness
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
    const afterBucketChangeCalls = mockSaveSessionDraftAndSync.mock.calls.length;
    expect(afterBucketChangeCalls).toBe(initialCalls + 1);

    act(() => {
      renderer?.update(
        <SessionPersistenceHarness
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
    expect(mockSaveSessionDraftAndSync).toHaveBeenCalledTimes(afterBucketChangeCalls);

    act(() => {
      renderer?.update(
        <SessionPersistenceHarness
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
    expect(mockSaveSessionDraftAndSync).toHaveBeenCalledTimes(afterBucketChangeCalls + 1);
  });
});
  async function flushMicrotasks() {
    await act(async () => {
      await Promise.resolve();
    });
  }

