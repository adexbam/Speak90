import React from 'react';
import { act, create } from 'react-test-renderer';
import {
  mockLoadSessionDraftAndSync,
  resetSessionPersistenceTestMocks,
} from './useSessionPersistence.test-setup';
import {
  SessionPersistenceHarness,
  dayFixture,
  getLatestSessionPersistenceHook,
} from './useSessionPersistence.test-harness';

describe('useSessionPersistence hydration', () => {
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

  it('hydrates from draft for matching day and restores timer/progression', async () => {
    const restoreFromDraft = jest.fn();
    const hydrateTimerFromDraft = jest.fn();
    mockLoadSessionDraftAndSync.mockResolvedValueOnce({
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

    expect(restoreFromDraft).toHaveBeenCalledWith({ sectionIndex: 1, sentenceIndex: 0, repRound: 2 });
    expect(hydrateTimerFromDraft).toHaveBeenCalledWith(180, 42);
    expect(getLatestSessionPersistenceHook()?.hydratedDraft).toBe(true);
  });
});
  async function flushMicrotasks() {
    await act(async () => {
      await Promise.resolve();
    });
  }

