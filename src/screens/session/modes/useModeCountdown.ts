import { useEffect } from 'react';

type UseModeCountdownParams = {
  enabled: boolean;
  onTick: () => void;
};

export function useModeCountdown({ enabled, onTick }: UseModeCountdownParams) {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const intervalId = setInterval(() => {
      onTick();
    }, 1000);
    return () => clearInterval(intervalId);
  }, [enabled, onTick]);
}

