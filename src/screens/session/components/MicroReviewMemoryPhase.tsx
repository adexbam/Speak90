import React, { useMemo } from 'react';
import { AppText } from '../../../ui/AppText';
import { PrimaryButton } from '../../../ui/PrimaryButton';
import { parseBilingualPair } from '../session-parsers';
import { SessionCard } from './SessionCard';

type MicroReviewMemoryPhaseProps = {
  memorySentences: string[];
  memoryIndex: number;
  memoryRevealed: boolean;
  memorySessionDone: boolean;
  onReveal: () => void;
  onAdvance: () => void;
  onFinish: () => void;
};

export function MicroReviewMemoryPhase({
  memorySentences,
  memoryIndex,
  memoryRevealed,
  memorySessionDone,
  onReveal,
  onAdvance,
  onFinish,
}: MicroReviewMemoryPhaseProps) {
  const memorySentence = memorySentences[memoryIndex] ?? '';
  const memoryPair = useMemo(() => parseBilingualPair(memorySentence), [memorySentence]);
  const isLastSentence = memoryIndex >= memorySentences.length - 1;

  return (
    <>
      <AppText variant="caption" center muted>
        Micro Review Session 2 of 2
      </AppText>
      <AppText variant="caption" center muted>
        Memory Drill ({memorySentences.length})
      </AppText>
      {memorySessionDone ? (
        <PrimaryButton label="Finish Session 2" onPress={onFinish} />
      ) : (
        <>
          <SessionCard
            sentence={memorySentence}
            speechText={memoryPair.back}
            isPatternSection
            isAnkiSection={false}
            isFreeSection={false}
            patternRevealed={memoryRevealed}
            ankiFlipped={false}
            patternPrompt={memoryPair.front}
            patternTarget={memoryPair.back}
            ankiFront=""
            ankiBack=""
            freePrompt=""
            freeCues={[]}
            sentenceShownLabel="00:00"
            showSentenceShownLabel={false}
          />
          {!memoryRevealed ? (
            <PrimaryButton label="Reveal" onPress={onReveal} />
          ) : (
            <>
              <AppText variant="caption" center muted>
                Great - tap {isLastSentence ? 'Finish Session 2' : 'Next Memory'}.
              </AppText>
              <PrimaryButton label={isLastSentence ? 'Finish Session 2' : 'Next Memory'} onPress={onAdvance} />
            </>
          )}
        </>
      )}
    </>
  );
}

