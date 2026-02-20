import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadCloudAudioConsentAudit, saveCloudAudioConsentAudit } from './cloud-audio-consent-store';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('cloud-audio-consent-store', () => {
  let state: Record<string, string>;

  beforeEach(() => {
    jest.clearAllMocks();
    state = {};
    storage.getItem.mockImplementation(async (key: string) => state[key] ?? null);
    storage.setItem.mockImplementation(async (key: string, value: string) => {
      state[key] = value;
    });
  });

  it('returns null when consent has not been saved', async () => {
    await expect(loadCloudAudioConsentAudit()).resolves.toBeNull();
  });

  it('persists and loads consent decision with timestamp', async () => {
    const payload = {
      decision: 'granted' as const,
      decidedAt: '2026-02-20T10:00:00.000Z',
    };
    await saveCloudAudioConsentAudit(payload);
    await expect(loadCloudAudioConsentAudit()).resolves.toEqual(payload);
  });
});

