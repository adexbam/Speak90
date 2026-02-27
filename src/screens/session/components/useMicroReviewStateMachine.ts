import { useEffect, useMemo, useState } from 'react';

type Phase = 'anki' | 'memory' | 'complete';

type UseMicroReviewStateMachineParams = {
  ankiCount: number;
  memoryCount: number;
};

export function useMicroReviewStateMachine({ ankiCount, memoryCount }: UseMicroReviewStateMachineParams) {
  const [phase, setPhase] = useState<Phase>('anki');
  const [ankiIndex, setAnkiIndex] = useState(0);
  const [ankiFlipped, setAnkiFlipped] = useState(false);
  const [memoryIndex, setMemoryIndex] = useState(0);
  const [memoryRevealed, setMemoryRevealed] = useState(false);

  useEffect(() => {
    setPhase('anki');
    setAnkiIndex(0);
    setAnkiFlipped(false);
    setMemoryIndex(0);
    setMemoryRevealed(false);
  }, [ankiCount, memoryCount]);

  const ankiSessionDone = useMemo(() => ankiCount === 0 || ankiIndex >= ankiCount, [ankiCount, ankiIndex]);
  const memorySessionDone = useMemo(() => memoryIndex >= memoryCount, [memoryIndex, memoryCount]);

  const flipAnki = () => setAnkiFlipped(true);
  const revealMemory = () => setMemoryRevealed(true);
  const continueToMemory = () => setPhase('memory');
  const finishToMain = () => setPhase('complete');

  const advanceAnki = () => {
    if (ankiIndex >= ankiCount - 1) {
      setPhase('memory');
      return;
    }
    setAnkiIndex((prev) => prev + 1);
    setAnkiFlipped(false);
  };

  const advanceMemory = () => {
    if (memoryIndex >= memoryCount - 1) {
      setPhase('complete');
      return;
    }
    setMemoryIndex((prev) => prev + 1);
    setMemoryRevealed(false);
  };

  return {
    phase,
    ankiIndex,
    ankiFlipped,
    memoryIndex,
    memoryRevealed,
    ankiSessionDone,
    memorySessionDone,
    flipAnki,
    revealMemory,
    continueToMemory,
    finishToMain,
    advanceAnki,
    advanceMemory,
  };
}

