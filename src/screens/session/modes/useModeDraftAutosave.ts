import { useEffect } from 'react';

type UseModeDraftAutosaveParams = {
  enabled: boolean;
  save: () => Promise<void> | void;
  delayMs?: number;
  dependencyKey: number;
};

export function useModeDraftAutosave({
  enabled,
  save,
  delayMs = 400,
  dependencyKey,
}: UseModeDraftAutosaveParams) {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const timeoutId = setTimeout(() => {
      void save();
    }, delayMs);
    return () => clearTimeout(timeoutId);
  }, [enabled, save, delayMs, dependencyKey]);
}

