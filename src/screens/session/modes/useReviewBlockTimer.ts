import { useCallback, useEffect } from 'react';
import { useModeCountdown } from './useModeCountdown';

type ReviewBlock = {
  durationMinutes?: number;
};

type UseReviewBlockTimerParams = {
  isModeActive: boolean;
  hydrated: boolean;
  completed: boolean;
  blockIndex: number;
  blocks: ReviewBlock[];
  fallbackMinutes: number;
  setBlockIndex: (next: number) => void;
  remainingSeconds: number;
  setRemainingSeconds: (next: number | ((prev: number) => number)) => void;
  setSessionElapsedSeconds: (next: number | ((prev: number) => number)) => void;
  setCompleted: (next: boolean) => void;
};

export function useReviewBlockTimer({
  isModeActive,
  hydrated,
  completed,
  blockIndex,
  blocks,
  fallbackMinutes,
  setBlockIndex,
  remainingSeconds,
  setRemainingSeconds,
  setSessionElapsedSeconds,
  setCompleted,
}: UseReviewBlockTimerParams) {
  const tick = useCallback(() => {
    setRemainingSeconds((prev) => (prev <= 0 ? 0 : prev - 1));
    setSessionElapsedSeconds((prev) => prev + 1);
  }, [setRemainingSeconds, setSessionElapsedSeconds]);

  useModeCountdown({
    enabled: isModeActive && hydrated && !completed,
    onTick: tick,
  });

  useEffect(() => {
    if (!isModeActive || !hydrated || completed || remainingSeconds > 0) return;
    const isLastBlock = blockIndex >= blocks.length - 1;
    if (isLastBlock) {
      setCompleted(true);
      return;
    }
    const nextBlockIndex = blockIndex + 1;
    setBlockIndex(nextBlockIndex);
    setRemainingSeconds((blocks[nextBlockIndex]?.durationMinutes ?? fallbackMinutes) * 60);
  }, [
    isModeActive,
    hydrated,
    completed,
    remainingSeconds,
    blockIndex,
    blocks,
    fallbackMinutes,
    setBlockIndex,
    setCompleted,
    setRemainingSeconds,
  ]);
}

