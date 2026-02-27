import React, { useMemo } from 'react';
import type { SrsCard } from '../../../data/srs-store';
import { AppText } from '../../../ui/AppText';
import { PrimaryButton } from '../../../ui/PrimaryButton';
import { SessionCard } from './SessionCard';

type MicroReviewAnkiPhaseProps = {
  cards: SrsCard[];
  cardIndex: number;
  flipped: boolean;
  ankiSessionDone: boolean;
  onFlip: () => void;
  onAdvance: () => void;
  onContinueToMemory: () => void;
};

export function MicroReviewAnkiPhase({
  cards,
  cardIndex,
  flipped,
  ankiSessionDone,
  onFlip,
  onAdvance,
  onContinueToMemory,
}: MicroReviewAnkiPhaseProps) {
  const activeCard = cards[cardIndex];
  const ankiFront = useMemo(() => activeCard?.prompt ?? '', [activeCard?.prompt]);
  const ankiBack = useMemo(() => activeCard?.answer ?? ankiFront, [activeCard?.answer, ankiFront]);
  const isLastCard = cardIndex >= cards.length - 1;

  return (
    <>
      <AppText variant="caption" center muted>
        Micro Review Session 1 of 2
      </AppText>
      <AppText variant="caption" center muted>
        Previous day Anki cards ({cards.length})
      </AppText>
      {cards.length === 0 ? (
        <>
          <AppText variant="caption" center muted>
            No cards from yesterday yet.
          </AppText>
          <PrimaryButton label="Continue to Session 2" onPress={onContinueToMemory} />
        </>
      ) : ankiSessionDone ? (
        <PrimaryButton label="Continue to Session 2" onPress={onContinueToMemory} />
      ) : (
        <>
          <SessionCard
            sentence={ankiFront}
            speechText={ankiBack}
            isPatternSection={false}
            isAnkiSection
            isFreeSection={false}
            patternRevealed={false}
            ankiFlipped={flipped}
            patternPrompt=""
            patternTarget=""
            ankiFront={ankiFront}
            ankiBack={ankiBack}
            freePrompt=""
            freeCues={[]}
            sentenceShownLabel="00:00"
            showSentenceShownLabel={false}
          />
          {!flipped ? (
            <PrimaryButton label="Flip" onPress={onFlip} />
          ) : (
            <>
              <AppText variant="caption" center muted>
                Great - tap {isLastCard ? 'Finish Session 1' : 'Next Anki'}.
              </AppText>
              <PrimaryButton label={isLastCard ? 'Finish Session 1' : 'Next Anki'} onPress={onAdvance} />
            </>
          )}
        </>
      )}
    </>
  );
}

