import React from 'react';
import { View } from 'react-native';
import type { SrsCard } from '../../../data/srs-store';
import { AppText } from '../../../ui/AppText';
import { ReviewRunnerScaffold } from './ReviewRunnerScaffold';
import { sessionStyles } from '../session.styles';
import { useMicroReviewStateMachine } from './useMicroReviewStateMachine';
import { MicroReviewAnkiPhase } from './MicroReviewAnkiPhase';
import { MicroReviewMemoryPhase } from './MicroReviewMemoryPhase';

type MicroReviewRunnerProps = {
  isLoading: boolean;
  cards: SrsCard[];
  memorySentences: string[];
  source: 'previous_day' | 'none';
  onContinue: () => void;
};

export function MicroReviewRunner({ isLoading, cards, memorySentences, source, onContinue }: MicroReviewRunnerProps) {
  const {
    phase,
    ankiIndex: cardIndex,
    ankiFlipped: flipped,
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
  } = useMicroReviewStateMachine({
    ankiCount: cards.length,
    memoryCount: memorySentences.length,
  });

  const subtitle =
    source === 'previous_day'
      ? 'Before new material: complete Session 1 (previous-day Anki) and Session 2 (memory drill).'
      : 'Before new material: complete Session 2 memory drill, then continue to main session.';

  return (
    <ReviewRunnerScaffold
      title="Micro Review"
      subtitle={subtitle}
      primaryAction={phase === 'complete' ? { label: 'Start Main Session', onPress: onContinue } : undefined}
    >
      {isLoading ? (
        <AppText variant="caption" center muted>
          Preparing previous-day cards...
        </AppText>
      ) : (
        <View style={sessionStyles.microReviewWrap}>
          {phase === 'anki' ? (
            <MicroReviewAnkiPhase
              cards={cards}
              cardIndex={cardIndex}
              flipped={flipped}
              ankiSessionDone={ankiSessionDone}
              onFlip={flipAnki}
              onAdvance={advanceAnki}
              onContinueToMemory={continueToMemory}
            />
          ) : null}

          {phase === 'memory' ? (
            <MicroReviewMemoryPhase
              memorySentences={memorySentences}
              memoryIndex={memoryIndex}
              memoryRevealed={memoryRevealed}
              memorySessionDone={memorySessionDone}
              onReveal={revealMemory}
              onAdvance={advanceMemory}
              onFinish={finishToMain}
            />
          ) : null}

          {phase === 'complete' ? (
            <View style={sessionStyles.reviewBlockCard}>
              <AppText variant="caption" center muted>
                Micro review complete. Start the main session when ready.
              </AppText>
            </View>
          ) : null}
        </View>
      )}
    </ReviewRunnerScaffold>
  );
}
