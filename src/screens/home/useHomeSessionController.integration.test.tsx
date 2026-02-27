import React from 'react';
import { act, create } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Router } from 'expo-router';
import type { DailyModeResolution } from '../../review/daily-mode-resolver';
import { useAppProgressStore } from '../../state/app-progress-store';
import { useHomeSessionController } from './useHomeSessionController';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('../../data/recordings-store', () => ({
  clearAllRecordings: jest.fn(),
}));
jest.mock('../../utils/blurActiveElement', () => ({
  blurActiveElement: jest.fn(),
}));

type HarnessProps = {
  router: Router;
  currentDay: number;
  dailyModeResolution: DailyModeResolution;
};

let latestController: ReturnType<typeof useHomeSessionController> | null = null;

function Harness({ router, currentDay, dailyModeResolution }: HarnessProps) {
  latestController = useHomeSessionController({
    router,
    currentDay,
    dailyModeResolution,
    startOver: async () => undefined,
  });
  return null;
}

describe('useHomeSessionController integration', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useAppProgressStore.setState({
      progress: {
        currentDay: 1,
        streak: 0,
        sessionsCompleted: [],
        totalMinutes: 0,
        reviewModeCompletionCounts: {
          new_day: 0,
          light_review: 0,
          deep_consolidation: 0,
          milestone: 0,
        },
      },
      sessionDraft: null,
      isHydrating: false,
      hydratedOnce: false,
    });
    latestController = null;
  });

  it('routes to next day session after completion -> home -> continue flow', async () => {
    await useAppProgressStore.getState().completeSessionAndSync({
      completedDay: 1,
      sessionSeconds: 120,
      totalDays: 90,
    });

    const currentDay = useAppProgressStore.getState().progress.currentDay;
    expect(currentDay).toBe(2);

    const push = jest.fn();
    const router = { push } as unknown as Router;
    const dailyModeResolution: DailyModeResolution = {
      mode: 'new_day',
      weeklySlot: 'new',
      currentDay,
      isMilestoneDay: false,
      reinforcementReviewDay: null,
      reinforcementCheckpointDay: null,
      pendingReinforcementCheckpointDays: [],
      dateKey: '2026-02-27',
    };

    let renderer: ReturnType<typeof create> | null = null;
    act(() => {
      renderer = create(<Harness router={router} currentDay={currentDay} dailyModeResolution={dailyModeResolution} />);
    });

    act(() => {
      latestController?.goToSession();
    });

    expect(push).toHaveBeenCalledWith({
      pathname: '/session',
      params: {
        day: '2',
        mode: 'new_day',
        reinforcementReviewDay: undefined,
        reinforcementCheckpointDay: undefined,
      },
    });

    act(() => {
      renderer?.unmount();
    });
  });
});

