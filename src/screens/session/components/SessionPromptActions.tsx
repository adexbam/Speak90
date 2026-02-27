import React from 'react';
import { View } from 'react-native';
import type { SessionSection, SessionSectionType } from '../../../data/day-model';
import { AppText } from '../../../ui/AppText';
import { PrimaryButton } from '../../../ui/PrimaryButton';
import { sessionStyles } from '../session.styles';

type SessionPromptActionsProps = {
  sectionType: SessionSectionType;
  section: SessionSection;
  repRound: number;
  isRepEnforced: boolean;
  ankiFlipped: boolean;
  patternRevealed: boolean;
  patternCompletedForSentence: boolean;
  onFlipAnki: () => void;
  onGradeAnki: (grade: 'again' | 'good' | 'easy') => void;
  onRevealPattern: () => void;
  onCompletePattern: () => void;
  onNext: () => void;
};

export function SessionPromptActions({
  sectionType,
  section,
  repRound,
  isRepEnforced,
  ankiFlipped,
  patternRevealed,
  patternCompletedForSentence,
  onFlipAnki,
  onGradeAnki,
  onRevealPattern,
  onCompletePattern,
  onNext,
}: SessionPromptActionsProps) {
  if (sectionType === 'anki') {
    if (!ankiFlipped) {
      return <PrimaryButton label="Flip" size="cta" onPress={onFlipAnki} />;
    }

    return (
      <View style={sessionStyles.rowActions}>
        <View style={sessionStyles.rowActionItem}>
          <PrimaryButton label="Again" onPress={() => onGradeAnki('again')} />
        </View>
        <View style={sessionStyles.rowActionItem}>
          <PrimaryButton label="Good" onPress={() => onGradeAnki('good')} />
        </View>
        <View style={sessionStyles.rowActionItem}>
          <PrimaryButton label="Easy" onPress={() => onGradeAnki('easy')} />
        </View>
      </View>
    );
  }

  if (sectionType === 'patterns') {
    return (
      <>
        <PrimaryButton
          label={patternRevealed ? '✓ Mark Complete' : 'Reveal'}
          size="cta"
          onPress={patternRevealed ? onCompletePattern : onRevealPattern}
        />
        {patternCompletedForSentence ? (
          <AppText variant="caption" center muted>
            Marked complete
          </AppText>
        ) : null}
      </>
    );
  }

  return (
    <PrimaryButton
      label={
        sectionType === 'free' ? 'Finish Free Output' : isRepEnforced ? `Next Sentence (Round ${repRound}/${section.reps})` : 'Next'
      }
      size="cta"
      onPress={onNext}
    />
  );
}
