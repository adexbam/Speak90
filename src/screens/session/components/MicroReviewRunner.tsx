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
  source: 'old' | 'recent' | 'none';
  onContinue: () => void;
};

export function MicroReviewRunner({ isLoading, cards, memorySentences, source, onContinue }: MicroReviewRunnerProps) {
  const [phase, setPhase] = useState<'anki' | 'memory' | 'complete'>('anki');
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
  }, [cards, memorySentences]);

  const activeAnkiPrompt = cards[ankiIndex]?.prompt ?? '';
  const activeMemorySentence = memorySentences[memoryIndex] ?? '';
  const ankiPair = useMemo(() => parseBilingualPair(activeAnkiPrompt), [activeAnkiPrompt]);
  const memoryPair = useMemo(() => parseBilingualPair(activeMemorySentence), [activeMemorySentence]);
  const ankiDone = cards.length === 0 || ankiIndex >= cards.length;
  const memoryDone = memorySentences.length === 0 || memoryIndex >= memorySentences.length;

  const subtitle =
    source === 'old'
      ? 'Before new material: review old Anki and memory sentences.'
      : source === 'recent'
        ? 'Before new material: warm up with recent Anki and memory sentences.'
        : 'Before new material: no review cards available yet. Continue to main session.';
  const cardTitle = source === 'old' ? `Old Anki cards (${cards.length})` : `Recent Anki cards (${cards.length})`;
  const emptyCardsMessage =
    source === 'old' ? 'Not enough 30+ day cards yet.' : 'No recent cards available yet. Main session is still available.';

  return (
    <ReviewRunnerScaffold
      title="Micro Review"
      subtitle={subtitle}
      primaryAction={phase === 'complete' ? { label: 'Start Main Session', onPress: onContinue } : undefined}
    >
      {isLoading ? (
        <AppText variant="caption" center muted>
          Preparing review cards...
        </AppText>
      ) : (
        <View style={sessionStyles.microReviewWrap}>
          {phase === 'anki' ? (
            <>
              <AppText variant="caption" center muted>
                Micro Review Session 1 of 2
              </AppText>
              <AppText variant="caption" center muted>
                {cardTitle}
              </AppText>
              {cards.length === 0 ? (
                <>
                  <AppText variant="caption" center muted>
                    {emptyCardsMessage}
                  </AppText>
                  <PrimaryButton label="Continue to Session 2" onPress={() => setPhase('memory')} />
                </>
              ) : ankiDone ? (
                <PrimaryButton label="Continue to Session 2" onPress={() => setPhase('memory')} />
              ) : (
                <>
                  <SessionCard
                    sentence={activeAnkiPrompt}
                    speechText={ankiPair.back}
                    isPatternSection={false}
                    isAnkiSection
                    isFreeSection={false}
                    patternRevealed={false}
                    ankiFlipped={ankiFlipped}
                    patternPrompt=""
                    patternTarget=""
                    ankiFront={ankiPair.front}
                    ankiBack={ankiPair.back}
                    freePrompt=""
                    freeCues={[]}
                    sentenceShownLabel="00:00"
                  />
                  {!ankiFlipped ? (
                    <PrimaryButton label="Flip" onPress={() => setAnkiFlipped(true)} />
                  ) : (
                    <PrimaryButton
                      label={ankiIndex >= cards.length - 1 ? 'Finish Session 1' : 'Next Anki'}
                      onPress={() => {
                        if (ankiIndex >= cards.length - 1) {
                          setPhase('memory');
                          return;
                        }
                        setAnkiIndex((prev) => prev + 1);
                        setAnkiFlipped(false);
                      }}
                    />
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
                Memory sentences ({memorySentences.length})
              </AppText>
              {memorySentences.length === 0 ? (
                <>
                  <AppText variant="caption" center muted>
                    Memory sentence prompts will appear as your review pool grows.
                  </AppText>
                  <PrimaryButton label="Finish Micro Review" onPress={() => setPhase('complete')} />
                </>
              ) : memoryDone ? (
                <PrimaryButton label="Finish Micro Review" onPress={() => setPhase('complete')} />
              ) : (
                <>
                  <SessionCard
                    sentence={activeMemorySentence}
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
                  />
                  {!memoryRevealed ? (
                    <PrimaryButton label="Reveal" onPress={() => setMemoryRevealed(true)} />
                  ) : (
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
                  )}
                </>
              )}
            </>
          ) : null}

          {phase === 'complete' ? (
            <AppText variant="caption" center muted>
              Micro review complete. Start the main session when ready.
            </AppText>
          ) : null}
        </View>
      )}
    </ReviewRunnerScaffold>
  );
}
