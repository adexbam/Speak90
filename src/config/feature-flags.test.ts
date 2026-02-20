import { DEFAULT_FEATURE_FLAGS, fetchRemoteFeatureFlags } from './feature-flags';

describe('feature-flags', () => {
  const originalEnv = process.env.EXPO_PUBLIC_REMOTE_CONFIG_URL;

  afterEach(() => {
    process.env.EXPO_PUBLIC_REMOTE_CONFIG_URL = originalEnv;
    jest.restoreAllMocks();
  });

  it('returns safe defaults when no remote config url is provided', async () => {
    delete process.env.EXPO_PUBLIC_REMOTE_CONFIG_URL;

    await expect(fetchRemoteFeatureFlags()).resolves.toEqual(DEFAULT_FEATURE_FLAGS);
  });

  it('returns safe defaults when fetch fails', async () => {
    process.env.EXPO_PUBLIC_REMOTE_CONFIG_URL = 'https://example.com/config.json';
    const fetchMock = jest.fn(async () => {
      throw new Error('network');
    });

    await expect(fetchRemoteFeatureFlags(fetchMock as unknown as typeof fetch)).resolves.toEqual(DEFAULT_FEATURE_FLAGS);
  });

  it('sanitizes and returns supported boolean flag values', async () => {
    process.env.EXPO_PUBLIC_REMOTE_CONFIG_URL = 'https://example.com/config.json';
    const fetchMock = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        v3_stt_on_device: true,
        v3_stt_cloud_opt_in: 'true',
        v3_cloud_backup: false,
        v3_premium_iap: true,
        ignored: true,
      }),
    }));

    await expect(fetchRemoteFeatureFlags(fetchMock as unknown as typeof fetch)).resolves.toEqual({
      v3_stt_on_device: true,
      v3_stt_cloud_opt_in: false,
      v3_cloud_backup: false,
      v3_premium_iap: true,
    });
  });
});

