import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { loadDays } from '../../data/day-loader';
import { AppText } from '../../ui/AppText';
import { PrimaryButton } from '../../ui/PrimaryButton';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/tokens';
import { useInterstitialOnComplete } from '../../ads/useInterstitialOnComplete';
import { BannerAdSlot } from '../../ads/BannerAdSlot';
import { blurActiveElement } from '../../utils/blurActiveElement';
import { SessionActions } from './components/SessionActions';
import { SessionCard } from './components/SessionCard';
import { nextSectionExpectations, sectionHints } from './session-copy';
import { parseBilingualPair } from './session-parsers';
import { SessionScaffold } from './components/SessionScaffold';
import { useSessionEngine } from './useSessionEngine';
import { useSessionPersistence } from './useSessionPersistence';
import { useSessionTimer } from './useSessionTimer';
import { sessionStyles } from './session.styles';
import { useSessionStore } from '../../state/session-store';
import { useSessionRecorder } from '../../audio/useSessionRecorder';
import { ensureSrsCardsForDay, reviewSrsCard } from '../../data/srs-store';

function formatSeconds(totalSeconds: number): string {
  const safe = Math.max(totalSeconds, 0);
  const minutes = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (safe % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function SessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ day?: string }>();
  const allDays = useMemo(() => loadDays(), []);
  const requestedDay = Number(params.day);
  const selectedDayNumber =
    Number.isInteger(requestedDay) && requestedDay > 0
      ? Math.min(requestedDay, allDays.length)
      : 1;
  const day = useMemo(() => allDays.find((d) => d.dayNumber === selectedDayNumber), [allDays, selectedDayNumber]);

  const patternRevealed = useSessionStore((s) => s.patternRevealed);
  const ankiFlipped = useSessionStore((s) => s.ankiFlipped);
  const patternCompleted = useSessionStore((s) => s.patternCompleted);
  const setPatternRevealed = useSessionStore((s) => s.setPatternRevealed);
  const setAnkiFlipped = useSessionStore((s) => s.setAnkiFlipped);
  const markPatternCompleted = useSessionStore((s) => s.markPatternCompleted);
  const resetForSection = useSessionStore((s) => s.resetForSection);
  const resetForSentence = useSessionStore((s) => s.resetForSentence);

  const sections = day?.sections ?? [];
  const {
    sectionIndex,
    sentenceIndex,
    repRound,
    sectionTransition,
    section,
    sentence,
    isComplete,
    isWarmupSection,
    isRepEnforced,
    restoreFromDraft,
    advanceToNextSection,
    continueFromTransition,
    advanceSentenceOrSection,
    advancePatternCard,
  } = useSessionEngine(sections);
  const showInterstitialIfReady = useInterstitialOnComplete();
  const isFreeSection = section?.type === 'free';
  const freePrompt = isFreeSection ? section.sentences[0] ?? '' : '';
  const freeCues = isFreeSection ? section.sentences.slice(1) : [];
  const isPatternSection = section?.type === 'patterns';
  const isAnkiSection = section?.type === 'anki';
  const patternPair = isPatternSection ? parseBilingualPair(sentence) : { front: sentence, back: sentence };
  const ankiPair = isAnkiSection ? parseBilingualPair(sentence) : { front: sentence, back: sentence };
  const patternPrompt = patternPair.front;
  const patternTarget = patternPair.back;
  const ankiFront = ankiPair.front;
  const ankiBack = ankiPair.back;
  const speechText = isPatternSection ? patternTarget : isAnkiSection ? ankiBack : sentence;
  const showRecordingControls = section?.type !== 'free';
  const {
    isRecording,
    isPlaying,
    hasLastRecording,
    playbackPositionMs,
    playbackDurationMs,
    errorMessage: recordingErrorMessage,
    startRecording,
    stopRecording,
    playLastRecording,
    seekLastRecording,
  } = useSessionRecorder({
    dayNumber: day?.dayNumber ?? 1,
    sectionId: section?.id ?? 'section',
  });
  const { remainingSeconds, sentenceShownSeconds, sessionElapsedSeconds, resetSentenceShown, restartSectionTimer, hydrateFromDraft } =
    useSessionTimer({
      isComplete,
      sectionIndex,
      sectionId: section?.id,
      sectionDuration: section?.duration,
    });
  const { hydratedDraft, progressSaved, persistDraftNow } = useSessionPersistence({
    day,
    section,
    isComplete,
    totalDays: allDays.length,
    sectionIndex,
    sentenceIndex,
    repRound,
    remainingSeconds,
    sessionElapsedSeconds,
    restoreFromDraft,
    hydrateTimerFromDraft: hydrateFromDraft,
  });

  const handleCloseSession = async () => {
    blurActiveElement();
    await persistDraftNow();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  useEffect(() => {
    if (!section) {
      return;
    }
    resetForSection();
  }, [section?.id, section, resetForSection]);

  useEffect(() => {
    resetSentenceShown();
    resetForSentence();
  }, [sentenceIndex, resetSentenceShown, resetForSentence]);

  useEffect(() => {
    if (!day) {
      return;
    }
    void ensureSrsCardsForDay(day);
  }, [day]);

  useEffect(() => {
    // Wait for draft hydration to avoid false warm-up expiry on initial mount.
    if (!hydratedDraft || !section || !isWarmupSection || remainingSeconds > 0) {
      return;
    }

    advanceToNextSection();
  }, [hydratedDraft, section, isWarmupSection, remainingSeconds, sectionIndex, sections.length]);

  if (!day) {
    return (
      <Screen style={sessionStyles.container}>
        <View style={sessionStyles.completeWrap}>
          <AppText variant="cardTitle" center>
            Session data missing
          </AppText>
          <PrimaryButton label="Back Home" onPress={() => router.replace('/')} />
        </View>
        <View style={sessionStyles.bannerWrap}>
          <View style={sessionStyles.bannerBox}>
            <BannerAdSlot />
          </View>
        </View>
      </Screen>
    );
  }

  const handleMarkPatternComplete = () => {
    markPatternCompleted(sentenceIndex);
    advancePatternCard();
  };

  const handleAnkiGrade = (grade: 'again' | 'good' | 'easy') => {
    if (day && section) {
      void reviewSrsCard({
        dayNumber: day.dayNumber,
        sectionId: section.id,
        sentenceIndex,
        sentence,
        grade,
      });
    }
    advanceSentenceOrSection();
  };

  if (sectionTransition) {
    return (
      <Screen style={sessionStyles.container}>
        <View style={sessionStyles.completeWrap}>
          <AppText variant="screenTitle" center>
            Section Complete
          </AppText>
          <AppText variant="bodySecondary" center>
            Great work on {sectionTransition.completedTitle}.
          </AppText>
          <AppText variant="cardTitle" center>
            Up next: {sectionTransition.nextTitle}
          </AppText>
          <AppText variant="caption" center muted>
            {nextSectionExpectations[sectionTransition.nextType]}
          </AppText>
          <PrimaryButton
            label="Continue to Next Section"
            onPress={continueFromTransition}
          />
        </View>
        <View style={sessionStyles.bannerWrap}>
          <View style={sessionStyles.bannerBox}>
            <BannerAdSlot />
          </View>
        </View>
      </Screen>
    );
  }

  if (isComplete) {
    const elapsedLabel = formatSeconds(sessionElapsedSeconds);
    return (
      <Screen style={sessionStyles.container}>
        <View style={sessionStyles.completeWrap}>
          <AppText variant="screenTitle" center>
            Session Complete
          </AppText>
          <AppText variant="bodySecondary" center>
            You completed Day {day.dayNumber}.
          </AppText>
          <AppText variant="cardTitle" center>
            Total elapsed: {elapsedLabel}
          </AppText>
          <AppText variant="caption" center muted>
            Saved as elapsed session time in progress stats.
          </AppText>
          {!progressSaved ? (
            <AppText variant="caption" center muted>
              Saving progress...
            </AppText>
          ) : null}
          <PrimaryButton
            label="View Stats"
            onPress={() => {
              blurActiveElement();
              router.push('/stats');
            }}
          />
          <PrimaryButton
            label="Back Home"
            onPress={async () => {
              blurActiveElement();
              await showInterstitialIfReady();
              router.replace('/');
            }}
          />
        </View>
        <View style={sessionStyles.bannerWrap}>
          <View style={sessionStyles.bannerBox}>
            <BannerAdSlot />
          </View>
        </View>
      </Screen>
    );
  }

  const timerColor =
    remainingSeconds === 0
      ? colors.accentSuccess
      : remainingSeconds <= 10
        ? colors.accentWarning
        : colors.textPrimary;

  const sectionMetaText = isFreeSection
    ? 'Free output timer running'
    : isRepEnforced
      ? `Round ${repRound}/${section.reps} - Sentence ${sentenceIndex + 1}/${section.sentences.length}`
      : `Sentence ${sentenceIndex + 1}/${section.sentences.length} - x${section.reps} reps`;

  return (
    <SessionScaffold
      sectionTitle={section.title}
      sectionIndex={sectionIndex + 1}
      sectionsCount={sections.length}
      sectionType={section.type}
      sectionMetaText={sectionMetaText}
      remainingLabel={formatSeconds(remainingSeconds)}
      timerColor={timerColor}
      onClose={() => void handleCloseSession()}
      footer={
        <View style={sessionStyles.bannerWrap}>
          <View style={sessionStyles.bannerBox}>
            <BannerAdSlot />
          </View>
        </View>
      }
    >
      <SessionCard
        sentence={sentence}
        speechText={speechText}
        isPatternSection={isPatternSection}
        isAnkiSection={isAnkiSection}
        isFreeSection={isFreeSection}
        patternRevealed={patternRevealed}
        ankiFlipped={ankiFlipped}
        patternPrompt={patternPrompt}
        patternTarget={patternTarget}
        ankiFront={ankiFront}
        ankiBack={ankiBack}
        freePrompt={freePrompt}
        freeCues={freeCues}
        sentenceShownLabel={formatSeconds(sentenceShownSeconds)}
      />

      <SessionActions
        sectionType={section.type}
        section={section}
        repRound={repRound}
        sentenceIndex={sentenceIndex}
        isRepEnforced={isRepEnforced}
        ankiFlipped={ankiFlipped}
        patternRevealed={patternRevealed}
        patternCompletedForSentence={!!patternCompleted[sentenceIndex]}
        hintText={sectionHints[section.type]}
        showRecordingControls={showRecordingControls}
        isRecording={isRecording}
        isPlaying={isPlaying}
        hasLastRecording={hasLastRecording}
        playbackPositionMs={playbackPositionMs}
        playbackDurationMs={playbackDurationMs}
        recordingErrorMessage={recordingErrorMessage}
        onFlipAnki={() => setAnkiFlipped(true)}
        onGradeAnki={handleAnkiGrade}
        onRevealPattern={() => setPatternRevealed(true)}
        onCompletePattern={handleMarkPatternComplete}
        onNext={() => {
          if (section.type === 'free') {
            advanceToNextSection();
            return;
          }
          advanceSentenceOrSection();
        }}
        onNextSection={advanceToNextSection}
        onRestartTimer={() => {
          restartSectionTimer(section.duration);
        }}
        onStartRecording={() => {
          void startRecording();
        }}
        onStopRecording={() => {
          void stopRecording();
        }}
        onTogglePlayback={() => {
          void playLastRecording();
        }}
        onSeekPlayback={(progressRatio) => {
          void seekLastRecording(progressRatio);
        }}
      />
    </SessionScaffold>
  );
}
