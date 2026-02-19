import React from 'react';
import { Pressable, View } from 'react-native';
import type { SessionSection, SessionSectionType } from '../../../data/day-model';
import { AppText } from '../../../ui/AppText';
import { PrimaryButton } from '../../../ui/PrimaryButton';
import { sessionStyles } from '../session.styles';
import { RecordingPlayback } from './RecordingPlayback';

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
  showRecordingControls: boolean;
  isRecording: boolean;
  isPlaying: boolean;
  hasLastRecording: boolean;
  playbackPositionMs: number;
  playbackDurationMs: number;
  recordingErrorMessage?: string | null;
  onFlipAnki: () => void;
  onGradeAnki: (grade: 'again' | 'good' | 'easy') => void;
  onRevealPattern: () => void;
  onCompletePattern: () => void;
  onNext: () => void;
  onNextSection: () => void;
  onRestartTimer: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onTogglePlayback: () => void;
  onSeekPlayback: (progressRatio: number) => void;
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
  showRecordingControls,
  isRecording,
  isPlaying,
  hasLastRecording,
  playbackPositionMs,
  playbackDurationMs,
  recordingErrorMessage,
  onFlipAnki,
  onGradeAnki,
  onRevealPattern,
  onCompletePattern,
  onNext,
  onNextSection,
  onRestartTimer,
  onStartRecording,
  onStopRecording,
  onTogglePlayback,
  onSeekPlayback,
}: SessionActionsProps) {
  return (
    <View style={sessionStyles.actionBar}>
      <AppText variant="caption" muted center>
        {hintText}
      </AppText>
      {showRecordingControls ? (
        <>
          <View style={sessionStyles.rowActions}>
            <View style={sessionStyles.rowActionItem}>
              <PrimaryButton label="Record" onPress={onStartRecording} disabled={isRecording} />
            </View>
            <View style={sessionStyles.rowActionItem}>
              <PrimaryButton label="Stop" onPress={onStopRecording} disabled={!isRecording} />
            </View>
          </View>
          <RecordingPlayback
            hasLastRecording={hasLastRecording}
            isPlaying={isPlaying}
            playbackPositionMs={playbackPositionMs}
            playbackDurationMs={playbackDurationMs}
            errorMessage={recordingErrorMessage}
            onTogglePlayback={onTogglePlayback}
            onSeek={onSeekPlayback}
          />
        </>
      ) : null}
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
