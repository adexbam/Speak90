import React from 'react';
import { Pressable, View } from 'react-native';
import type { SessionSection, SessionSectionType } from '../../../data/day-model';
import { AppText } from '../../../ui/AppText';
import { PrimaryButton } from '../../../ui/PrimaryButton';
import { sessionStyles } from '../session.styles';

type SessionActionsProps = {
  sectionType: SessionSectionType;
  section: SessionSection;
  repRound: number;
  sentenceIndex: number;
  isRepEnforced: boolean;
  ankiFlipped: boolean;
  patternRevealed: boolean;
  patternCompletedForSentence: boolean;
  hintText: string;
  onFlipAnki: () => void;
  onGradeAnki: (grade: 'again' | 'good' | 'easy') => void;
  onRevealPattern: () => void;
  onCompletePattern: () => void;
  onNext: () => void;
  onNextSection: () => void;
  onRestartTimer: () => void;
};

export function SessionActions({
  sectionType,
  section,
  repRound,
  sentenceIndex,
  isRepEnforced,
  ankiFlipped,
  patternRevealed,
  patternCompletedForSentence,
  hintText,
  onFlipAnki,
  onGradeAnki,
  onRevealPattern,
  onCompletePattern,
  onNext,
  onNextSection,
  onRestartTimer,
}: SessionActionsProps) {
  return (
    <View style={sessionStyles.actionBar}>
      <AppText variant="caption" muted center>
        {hintText}
      </AppText>
      {sectionType === 'anki' ? (
        !ankiFlipped ? (
          <PrimaryButton label="Flip" size="cta" onPress={onFlipAnki} />
        ) : (
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
        )
      ) : sectionType === 'patterns' ? (
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
      ) : (
        <PrimaryButton
          label={
            sectionType === 'free' ? 'Finish Free Output' : isRepEnforced ? `Next Sentence (Round ${repRound}/${section.reps})` : 'Next'
          }
          size="cta"
          onPress={onNext}
        />
      )}
      <Pressable style={sessionStyles.secondaryAction} onPress={onNextSection}>
        <AppText variant="bodySecondary" center>
          I&apos;m confident - Next Section
        </AppText>
      </Pressable>
      <Pressable style={sessionStyles.secondaryAction} onPress={onRestartTimer}>
        <AppText variant="bodySecondary" center>
          Restart timer
        </AppText>
      </Pressable>
    </View>
  );
}
