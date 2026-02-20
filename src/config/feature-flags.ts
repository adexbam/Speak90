export type FeatureFlags = {
  v3_stt_on_device: boolean;
  v3_stt_cloud_opt_in: boolean;
  v3_cloud_backup: boolean;
  v3_premium_iap: boolean;
};

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  v3_stt_on_device: false,
  v3_stt_cloud_opt_in: false,
  v3_cloud_backup: false,
  v3_premium_iap: false,
};

const FEATURE_FLAG_KEYS: Array<keyof FeatureFlags> = [
  'v3_stt_on_device',
  'v3_stt_cloud_opt_in',
  'v3_cloud_backup',
  'v3_premium_iap',
];

function sanitizeFeatureFlags(value: unknown): FeatureFlags {
  if (!value || typeof value !== 'object') {
    return DEFAULT_FEATURE_FLAGS;
  }

  const candidate = value as Partial<Record<keyof FeatureFlags, unknown>>;
  const sanitized = { ...DEFAULT_FEATURE_FLAGS };
  FEATURE_FLAG_KEYS.forEach((key) => {
    sanitized[key] = candidate[key] === true;
  });
  return sanitized;
}

function getRemoteConfigUrl(): string | null {
  const raw = process.env.EXPO_PUBLIC_REMOTE_CONFIG_URL?.trim();
  return raw ? raw : null;
}

export async function fetchRemoteFeatureFlags(fetchImpl: typeof fetch = fetch): Promise<FeatureFlags> {
  const remoteUrl = getRemoteConfigUrl();
  if (!remoteUrl) {
    return DEFAULT_FEATURE_FLAGS;
  }

  try {
    const response = await fetchImpl(remoteUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      return DEFAULT_FEATURE_FLAGS;
    }

    const payload: unknown = await response.json();
    return sanitizeFeatureFlags(payload);
  } catch {
    return DEFAULT_FEATURE_FLAGS;
  }
}

