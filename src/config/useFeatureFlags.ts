import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_FEATURE_FLAGS, fetchRemoteFeatureFlags, type FeatureFlags } from './feature-flags';

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const latestRequestRef = useRef(0);

  const refreshFlags = useCallback(async () => {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;
    setIsLoading(true);
    setErrorMessage(null);

    const nextFlags = await fetchRemoteFeatureFlags();
    if (latestRequestRef.current !== requestId) {
      return;
    }

    setFlags(nextFlags);
    setLastUpdatedAt(new Date().toISOString());
    const changed = JSON.stringify(nextFlags) !== JSON.stringify(DEFAULT_FEATURE_FLAGS);
    setErrorMessage(changed ? null : 'Using local defaults.');
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refreshFlags();
  }, [refreshFlags]);

  return {
    flags,
    isLoading,
    lastUpdatedAt,
    errorMessage,
    refreshFlags,
  };
}

