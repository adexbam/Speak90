import React from 'react';
import type { SrsCard } from '../../../data/srs-store';
import { AppText } from '../../../ui/AppText';
import { ReviewRunnerScaffold } from './ReviewRunnerScaffold';
import { MicroReviewCard } from './MicroReviewCard';

type MicroReviewRunnerProps = {
  isLoading: boolean;
  cards: SrsCard[];
  memorySentences: string[];
  onContinue: () => void;
};

export function MicroReviewRunner({ isLoading, cards, memorySentences, onContinue }: MicroReviewRunnerProps) {
  const promptItems = cards.map((card) => card.prompt);

  return (
    <ReviewRunnerScaffold
      title="Micro Review"
      subtitle="Before new material: review old Anki and memory sentences."
      primaryAction={{
        label: 'Start Main Session',
        onPress: onContinue,
      }}
    >
      {isLoading ? (
        <AppText variant="caption" center muted>
          Preparing 30+ day review cards...
        </AppText>
      ) : (
        <>
          <MicroReviewCard title={`Old Anki cards (${promptItems.length})`} items={promptItems} emptyMessage="Not enough 30+ day cards yet." />
          <MicroReviewCard
            title={`Memory sentences (${memorySentences.length})`}
            items={memorySentences}
            emptyMessage="Memory sentence prompts will appear as your review pool grows."
          />
        </>
      )}
    </ReviewRunnerScaffold>
  );
}
