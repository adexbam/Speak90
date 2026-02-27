import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import type { SrsCard } from '../../../data/srs-store';
import { AppText } from '../../../ui/AppText';
import { PrimaryButton } from '../../../ui/PrimaryButton';
import { ReviewRunnerScaffold } from './ReviewRunnerScaffold';
import { SessionCard } from './SessionCard';
import { sessionStyles } from '../session.styles';

type MicroReviewRunnerProps = {
  isLoading: boolean;
  cards: SrsCard[];
  source: 'previous_day' | 'none';
  onContinue: () => void;
};

export function MicroReviewRunner({ isLoading, cards, source, onContinue }: MicroReviewRunnerProps) {
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setCardIndex(0);
    setFlipped(false);
  }, [cards]);

  const activeCard = cards[cardIndex];
  const ankiFront = useMemo(() => activeCard?.prompt ?? '', [activeCard?.prompt]);
  const ankiBack = useMemo(() => activeCard?.answer ?? ankiFront, [activeCard?.answer, ankiFront]);
  const sessionDone = cards.length === 0 || cardIndex >= cards.length;

  const subtitle =
    source === 'previous_day'
      ? 'Before new material: repeat Anki cards from yesterday.'
      : 'Before new material: no previous-day cards available yet. Continue to main session.';

  return (
    <ReviewRunnerScaffold
      title="Micro Review"
      subtitle={subtitle}
      primaryAction={sessionDone ? { label: 'Start Main Session', onPress: onContinue } : undefined}
    >
      {isLoading ? (
        <AppText variant="caption" center muted>
          Preparing previous-day cards...
        </AppText>
      ) : (
        <View style={sessionStyles.microReviewWrap}>
          <AppText variant="caption" center muted>
            Previous day Anki cards ({cards.length})
          </AppText>
          {cards.length === 0 ? (
            <AppText variant="caption" center muted>
              No cards from yesterday yet.
            </AppText>
          ) : sessionDone ? (
            <AppText variant="caption" center muted>
              Micro review complete. Start the main session when ready.
            </AppText>
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
                    Great - tap {cardIndex >= cards.length - 1 ? 'Finish Review' : 'Next Anki'}.
                  </AppText>
                  <PrimaryButton
                    label={cardIndex >= cards.length - 1 ? 'Finish Review' : 'Next Anki'}
                    onPress={() => {
                      setCardIndex((prev) => prev + 1);
                      setFlipped(false);
                    }}
                  />
                </>
              )}
            </>
          )}
        </View>
      )}
    </ReviewRunnerScaffold>
  );
}
