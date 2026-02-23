jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const storage = require('@react-native-async-storage/async-storage') as {
  getItem: jest.Mock;
  setItem: jest.Mock;
  removeItem: jest.Mock;
};
const progressStore = require('./progress-store') as typeof import('./progress-store');

describe('progress-store review metrics', () => {
  let storageMap: Record<string, string>;

  beforeEach(() => {
    jest.clearAllMocks();
    storageMap = {};

    storage.getItem.mockImplementation(async (key: string) => storageMap[key] ?? null);
    storage.setItem.mockImplementation(async (key: string, value: string) => {
      storageMap[key] = value;
    });
    storage.removeItem.mockImplementation(async (key: string) => {
      delete storageMap[key];
    });
  });

  it('increments completion counts by mode', async () => {
    await progressStore.incrementReviewModeCompletionAndSave('new_day');
    await progressStore.incrementReviewModeCompletionAndSave('light_review');
    await progressStore.incrementReviewModeCompletionAndSave('new_day');

    const progress = await progressStore.loadUserProgress();
    expect(progress.reviewModeCompletionCounts?.new_day).toBe(2);
    expect(progress.reviewModeCompletionCounts?.light_review).toBe(1);
  });

  it('tracks micro-review shown/completed by date', async () => {
    const date = new Date('2026-02-23T08:00:00');
    await progressStore.markMicroReviewShownAndSave(date);
    await progressStore.markMicroReviewCompletedAndSave(date);

    const progress = await progressStore.loadUserProgress();
    expect(progress.microReviewShownDates).toEqual(['2026-02-23']);
    expect(progress.microReviewCompletedDates).toEqual(['2026-02-23']);
  });

  it('tracks reinforcement offered/completed separately', async () => {
    await progressStore.markReinforcementCheckpointOfferedAndSave(30);
    await progressStore.completeReinforcementCheckpointAndSave(30);

    const progress = await progressStore.loadUserProgress();
    expect(progress.offeredReinforcementCheckpointDays).toEqual([30]);
    expect(progress.completedReinforcementCheckpointDays).toEqual([30]);
  });
});
