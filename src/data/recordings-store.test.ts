import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addRecordingMetadata,
  applyRecordingRetention,
  clearAllRecordings,
  getLatestRecordingForSection,
  loadRecordingMetadataList,
} from './recordings-store';

const mockGetInfoAsync = jest.fn();
const mockDeleteAsync = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///documents/',
  getInfoAsync: (...args: unknown[]) => mockGetInfoAsync(...args),
  deleteAsync: (...args: unknown[]) => mockDeleteAsync(...args),
}));

const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('recordings-store', () => {
  let storageMap: Record<string, string>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetInfoAsync.mockResolvedValue({ exists: true });
    mockDeleteAsync.mockResolvedValue(undefined);
    storageMap = {};

    storage.getItem.mockImplementation(async (key: string) => storageMap[key] ?? null);
    storage.setItem.mockImplementation(async (key: string, value: string) => {
      storageMap[key] = value;
    });
    storage.removeItem.mockImplementation(async (key: string) => {
      delete storageMap[key];
    });
  });

  it('adds metadata and returns latest for section', async () => {
    await addRecordingMetadata({
      id: '1',
      dayNumber: 1,
      sectionId: 'warmup',
      createdAt: '2099-01-01T00:00:00.000Z',
      fileUri: 'file:///documents/speak90/recordings/a.m4a',
      durationMs: 1234,
    });

    const latest = await getLatestRecordingForSection(1, 'warmup');
    expect(latest?.fileUri).toContain('a.m4a');
  });

  it('applies retention by removing expired files from metadata', async () => {
    storage.getItem.mockResolvedValue(
      JSON.stringify([
        {
          id: 'old',
          dayNumber: 1,
          sectionId: 'warmup',
          createdAt: '2000-01-01T00:00:00.000Z',
          fileUri: 'file:///documents/speak90/recordings/old.m4a',
          durationMs: 2000,
        },
      ]),
    );

    const kept = await applyRecordingRetention(30);
    expect(kept).toHaveLength(0);
    expect(mockDeleteAsync).toHaveBeenCalled();
  });

  it('clears all recordings and storage key', async () => {
    storage.getItem.mockResolvedValue(
      JSON.stringify([
        {
          id: 'x',
          dayNumber: 1,
          sectionId: 'verbs',
          createdAt: '2099-01-01T00:00:00.000Z',
          fileUri: 'file:///documents/speak90/recordings/x.m4a',
          durationMs: 1000,
        },
      ]),
    );

    await clearAllRecordings();
    expect(mockDeleteAsync).toHaveBeenCalled();
    expect(storage.removeItem).toHaveBeenCalled();
  });

  it('returns empty list for malformed metadata payload', async () => {
    storage.getItem.mockResolvedValue('{bad-json');
    await expect(loadRecordingMetadataList()).resolves.toEqual([]);
  });
});
