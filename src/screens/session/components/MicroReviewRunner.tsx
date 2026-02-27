import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import type { SrsCard } from '../../../data/srs-store';
import { AppText } from '../../../ui/AppText';
import { PrimaryButton } from '../../../ui/PrimaryButton';
import { ReviewRunnerScaffold } from './ReviewRunnerScaffold';
import { SessionCard } from './SessionCard';
import { parseBilingualPair } from '../session-parsers';
import { sessionStyles } from '../session.styles';

type MicroReviewRunnerProps = {
  isLoading: boolean;
  cards: SrsCard[];
  memorySentences: string[];
  source: 'previous_day' | 'none';
  onContinue: () => void;
};

export function MicroReviewRunner({ isLoading, cards, memorySentences, source, onContinue }: MicroReviewRunnerProps) {
  const [phase, setPhase] = useState<'anki' | 'memory' | 'complete'>('anki');
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [memoryIndex, setMemoryIndex] = useState(0);
  const [memoryRevealed, setMemoryRevealed] = useState(false);

  useEffect(() => {
    setPhase('anki');
    setCardIndex(0);
    setFlipped(false);
    setMemoryIndex(0);
    setMemoryRevealed(false);
  }, [cards, memorySentences]);

  const activeCard = cards[cardIndex];
  const ankiFront = useMemo(() => activeCard?.prompt ?? '', [activeCard?.prompt]);
  const ankiBack = useMemo(() => activeCard?.answer ?? ankiFront, [activeCard?.answer, ankiFront]);
  const ankiSessionDone = cards.length === 0 || cardIndex >= cards.length;
  const memorySentence = memorySentences[memoryIndex] ?? '';
  const memoryPair = parseBilingualPair(memorySentence);
  const memorySessionDone = memoryIndex >= memorySentences.length;

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
                  <PrimaryButton label="Continue to Session 2" onPress={() => setPhase('memory')} />
                </>
              ) : ankiSessionDone ? (
                <PrimaryButton label="Continue to Session 2" onPress={() => setPhase('memory')} />
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
                    <PrimaryButton label="Flip" onPress={() => setFlipped(true)} />
                  ) : (
                    <>
                      <AppText variant="caption" center muted>
                        Great - tap {cardIndex >= cards.length - 1 ? 'Finish Session 1' : 'Next Anki'}.
                      </AppText>
                      <PrimaryButton
                        label={cardIndex >= cards.length - 1 ? 'Finish Session 1' : 'Next Anki'}
                        onPress={() => {
                          if (cardIndex >= cards.length - 1) {
                            setPhase('memory');
                            return;
                          }
                          setCardIndex((prev) => prev + 1);
                          setFlipped(false);
                        }}
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
                <PrimaryButton label="Finish Session 2" onPress={() => setPhase('complete')} />
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
                    <PrimaryButton label="Reveal" onPress={() => setMemoryRevealed(true)} />
                  ) : (
                    <>
                      <AppText variant="caption" center muted>
                        Great - tap {memoryIndex >= memorySentences.length - 1 ? 'Finish Session 2' : 'Next Memory'}.
                      </AppText>
                      <PrimaryButton
                        label={memoryIndex >= memorySentences.length - 1 ? 'Finish Session 2' : 'Next Memory'}
                        onPress={() => {
                          if (memoryIndex >= memorySentences.length - 1) {
                            setPhase('complete');
                            return;
                          }
                          setMemoryIndex((prev) => prev + 1);
                          setMemoryRevealed(false);
                        }}
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
