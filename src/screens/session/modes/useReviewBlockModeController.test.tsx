import React from 'react';
import { act, create } from 'react-test-renderer';
import type { Day } from '../../../data/day-model';
import { useReviewBlockModeController } from './useReviewBlockModeController';

const mockTrackEvent = jest.fn();

jest.mock('../../../analytics/events', () => ({
  buildAnalyticsPayload: jest.fn((base: Record<string, unknown>, extras?: Record<string, unknown>) => ({
    ...base,
    ...(extras ?? {}),
  })),
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}));

type HookState = ReturnType<typeof useReviewBlockModeController>;
let latest: HookState | null = null;

const dayFixture: Day = {
  dayNumber: 7,
  sections: [],
};

function Harness() {
  latest = useReviewBlockModeController({
    day: dayFixture,
    isPracticeMode: false,
    isModeActive: true,
    mode: 'light_review',
    analyticsSectionId: 'review.light_review',
    blocks: [{ durationMinutes: 1 }, { durationMinutes: 2 }],
    fallbackMinutes: 1,
    loadSessionDraftAndSync: async () => ({
      dayNumber: 7,
      mode: 'light_review',
      sectionIndex: 99,
      sentenceIndex: 0,
      remainingSeconds: 500,
      sessionElapsedSeconds: 13,
      savedAt: '2026-02-27T00:00:00.000Z',
    }),
    saveSessionDraftAndSync: jest.fn(async () => undefined),
    clearSessionDraftAndSync: jest.fn(async () => undefined),
    completeModeAndSync: jest.fn(async () => undefined),
    incrementReviewModeCompletionAndSync: jest.fn(async () => undefined),
  });
  return null;
}

function getHook() {
  if (!latest) {
    throw new Error('Hook not initialized');
  }
  return latest;
}

describe('useReviewBlockModeController', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    latest = null;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('hydrates and clamps draft block index/duration', async () => {
    let renderer: ReturnType<typeof create>;
    await act(async () => {
      renderer = create(<Harness />);
      await Promise.resolve();
    });

    expect(getHook().hydrated).toBe(true);
    expect(getHook().blockIndex).toBe(1);
    expect(getHook().remainingSeconds).toBe(120);
    expect(getHook().sessionElapsedSeconds).toBe(13);

    act(() => {
      renderer.unmount();
    });
  });

  it('moves to next block when timer reaches zero on a non-final block', async () => {
    let renderer: ReturnType<typeof create>;
    await act(async () => {
      renderer = create(<Harness />);
      await Promise.resolve();
    });

    act(() => {
      getHook().setBlockIndex(0);
      getHook().setRemainingSeconds(0);
    });

    expect(getHook().blockIndex).toBe(1);
    expect(getHook().remainingSeconds).toBe(120);
    expect(getHook().completed).toBe(false);

    act(() => {
      renderer.unmount();
    });
  });

  it('persists completion once when final block completes', async () => {
    const completeModeAndSync = jest.fn(async () => undefined);
    const incrementReviewModeCompletionAndSync = jest.fn(async () => undefined);
    const clearSessionDraftAndSync = jest.fn(async () => undefined);

    function CompleteHarness() {
      latest = useReviewBlockModeController({
        day: dayFixture,
        isPracticeMode: false,
        isModeActive: true,
        mode: 'light_review',
        analyticsSectionId: 'review.light_review',
        blocks: [{ durationMinutes: 1 }],
        fallbackMinutes: 1,
        loadSessionDraftAndSync: async () => null,
        saveSessionDraftAndSync: jest.fn(async () => undefined),
        clearSessionDraftAndSync,
        completeModeAndSync,
        incrementReviewModeCompletionAndSync,
      });
      return null;
    }

    let renderer: ReturnType<typeof create>;
    await act(async () => {
      renderer = create(<CompleteHarness />);
      await Promise.resolve();
    });

    await act(async () => {
      getHook().setCompleted(true);
      await Promise.resolve();
    });

    expect(completeModeAndSync).toHaveBeenCalledTimes(1);
    expect(incrementReviewModeCompletionAndSync).toHaveBeenCalledTimes(1);
    expect(clearSessionDraftAndSync).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith(
      'review_mode_completed',
      expect.objectContaining({
        dayNumber: 7,
        sectionId: 'review.light_review',
      }),
    );

    act(() => {
      renderer.unmount();
    });
  });
});

