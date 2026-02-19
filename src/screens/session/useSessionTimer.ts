import { useCallback, useEffect, useState } from 'react';

type UseSessionTimerParams = {
  isComplete: boolean;
  sectionIndex: number;
  sectionId?: string;
  sectionDuration?: number;
};

export function useSessionTimer({ isComplete, sectionIndex, sectionId, sectionDuration }: UseSessionTimerParams) {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [sentenceShownSeconds, setSentenceShownSeconds] = useState(0);
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState(0);

  useEffect(() => {
    if (isComplete) {
      return;
    }

    const intervalId = setInterval(() => {
      setRemainingSeconds((prev) => (prev <= 0 ? 0 : prev - 1));
      setSentenceShownSeconds((prev) => prev + 1);
      setSessionElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isComplete, sectionIndex]);

  useEffect(() => {
    if (sectionDuration === undefined) {
      return;
    }

    setRemainingSeconds(sectionDuration);
    setSentenceShownSeconds(0);
  }, [sectionId, sectionDuration]);

  const resetSentenceShown = useCallback(() => {
    setSentenceShownSeconds(0);
  }, []);

  const restartSectionTimer = useCallback((duration: number) => {
    setRemainingSeconds(duration);
    setSentenceShownSeconds(0);
  }, []);

  const hydrateFromDraft = useCallback((remaining: number, elapsed: number) => {
    setRemainingSeconds(remaining);
    setSessionElapsedSeconds(elapsed);
  }, []);

  return {
    remainingSeconds,
    sentenceShownSeconds,
    sessionElapsedSeconds,
    resetSentenceShown,
    restartSectionTimer,
    hydrateFromDraft,
  };
}
