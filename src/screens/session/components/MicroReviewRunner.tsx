import React, { useMemo } from 'react';
import { View } from 'react-native';
import type { SrsCard } from '../../../data/srs-store';
import { AppText } from '../../../ui/AppText';
import { PrimaryButton } from '../../../ui/PrimaryButton';
import { ReviewRunnerScaffold } from './ReviewRunnerScaffold';
import { SessionCard } from './SessionCard';
import { parseBilingualPair } from '../session-parsers';
import { sessionStyles } from '../session.styles';
import { useMicroReviewStateMachine } from './useMicroReviewStateMachine';

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

  const activeCard = cards[cardIndex];
  const ankiFront = useMemo(() => activeCard?.prompt ?? '', [activeCard?.prompt]);
  const ankiBack = useMemo(() => activeCard?.answer ?? ankiFront, [activeCard?.answer, ankiFront]);
  const memorySentence = memorySentences[memoryIndex] ?? '';
  const memoryPair = parseBilingualPair(memorySentence);

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
                  <PrimaryButton label="Continue to Session 2" onPress={continueToMemory} />
                </>
              ) : ankiSessionDone ? (
                <PrimaryButton label="Continue to Session 2" onPress={continueToMemory} />
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
                    <PrimaryButton label="Flip" onPress={flipAnki} />
                  ) : (
                    <>
                      <AppText variant="caption" center muted>
                        Great - tap {cardIndex >= cards.length - 1 ? 'Finish Session 1' : 'Next Anki'}.
                      </AppText>
                      <PrimaryButton
                        label={cardIndex >= cards.length - 1 ? 'Finish Session 1' : 'Next Anki'}
                        onPress={advanceAnki}
                      />
                    </>
                  )}
                </>
              )}
            </>
          ) : null}

          {phase === 'memory' ? (
            <>
              <AppText variant="caption" center muted>
                Micro Review Session 2 of 2
              </AppText>
              <AppText variant="caption" center muted>
                Memory Drill ({memorySentences.length})
              </AppText>
              {memorySessionDone ? (
                <PrimaryButton label="Finish Session 2" onPress={finishToMain} />
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
                    <PrimaryButton label="Reveal" onPress={revealMemory} />
                  ) : (
                    <>
                      <AppText variant="caption" center muted>
                        Great - tap {memoryIndex >= memorySentences.length - 1 ? 'Finish Session 2' : 'Next Memory'}.
                      </AppText>
                      <PrimaryButton
                        label={memoryIndex >= memorySentences.length - 1 ? 'Finish Session 2' : 'Next Memory'}
                        onPress={advanceMemory}
                      />
                    </>
                  )}
                </>
              )}
            </>
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
