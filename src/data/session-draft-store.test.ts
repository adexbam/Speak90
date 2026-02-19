import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearSessionDraft, loadSessionDraft, saveSessionDraft } from './session-draft-store';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('session-draft-store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves and loads a valid draft', async () => {
    const draft = {
      dayNumber: 1,
      sectionIndex: 2,
      sentenceIndex: 3,
      repRound: 1,
      remainingSeconds: 120,
      sessionElapsedSeconds: 300,
      savedAt: '2026-02-19T00:00:00.000Z',
    };

    mockStorage.getItem.mockResolvedValueOnce(JSON.stringify(draft));
    await saveSessionDraft(draft);
    const loaded = await loadSessionDraft();

    expect(mockStorage.setItem).toHaveBeenCalledTimes(1);
    expect(loaded).toEqual(draft);
  });

  it('returns null for malformed or invalid drafts', async () => {
    mockStorage.getItem.mockResolvedValueOnce('{oops');
    await expect(loadSessionDraft()).resolves.toBeNull();

    mockStorage.getItem.mockResolvedValueOnce(
      JSON.stringify({
        dayNumber: 1,
        sectionIndex: -1,
        sentenceIndex: 0,
        remainingSeconds: 10,
        sessionElapsedSeconds: 10,
      }),
    );
    await expect(loadSessionDraft()).resolves.toBeNull();
  });

  it('clears draft key', async () => {
    await clearSessionDraft();

    expect(mockStorage.removeItem).toHaveBeenCalledTimes(1);
    expect(mockStorage.removeItem).toHaveBeenCalledWith(expect.stringContaining('session-draft'));
  });
});
