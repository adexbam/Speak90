import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppProgressStore } from './app-progress-store';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

describe('app-progress-store integration', () => {
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
  });

  it('keeps day advancement when completion and mode increment are triggered together', async () => {
    await useAppProgressStore.getState().hydrate();

    await Promise.all([
      useAppProgressStore.getState().completeSessionAndSync({
        completedDay: 1,
        sessionSeconds: 120,
        totalDays: 90,
      }),
      useAppProgressStore.getState().incrementReviewModeCompletionAndSync('new_day'),
    ]);

    const next = useAppProgressStore.getState().progress;
    expect(next.currentDay).toBe(2);
    expect(next.sessionsCompleted).toContain(1);
    expect(next.reviewModeCompletionCounts?.new_day).toBe(1);
  });
});
