import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { loadDays } from '../../data/day-loader';
import { AppText } from '../../ui/AppText';
import { PrimaryButton } from '../../ui/PrimaryButton';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/tokens';
import { completeSessionAndSave } from '../../data/progress-store';
import { clearSessionDraft, loadSessionDraft, saveSessionDraft } from '../../data/session-draft-store';
import { useInterstitialOnComplete } from '../../ads/useInterstitialOnComplete';
import { BannerAdSlot } from '../../ads/BannerAdSlot';
import { blurActiveElement } from '../../utils/blurActiveElement';
import { SessionActions } from './components/SessionActions';
import { SessionCard } from './components/SessionCard';
import { nextSectionExpectations, sectionHints } from './session-copy';
import { SessionScaffold } from './components/SessionScaffold';
import { useSessionEngine } from './useSessionEngine';
import { sessionStyles } from './session.styles';

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

  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [sentenceShownSeconds, setSentenceShownSeconds] = useState(0);
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState(0);
  const [patternRevealed, setPatternRevealed] = useState(false);
  const [ankiFlipped, setAnkiFlipped] = useState(false);
  const [patternCompleted, setPatternCompleted] = useState<Record<number, true>>({});
  const [progressSaved, setProgressSaved] = useState(false);
  const [hydratedDraft, setHydratedDraft] = useState(false);

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
  const [patternPrompt, patternTarget] = isPatternSection ? sentence.split(' -> ').map((x) => x.trim()) : [sentence, sentence];
  const [ankiFront, ankiBack] = isAnkiSection ? sentence.split(' -> ').map((x) => x.trim()) : [sentence, sentence];
  const speechText = isPatternSection ? patternTarget : isAnkiSection ? ankiBack : sentence;
  const draftRemainingBucket = Math.floor(remainingSeconds / 5);
  const draftElapsedBucket = Math.floor(sessionElapsedSeconds / 5);

  const persistDraftNow = useCallback(async () => {
    if (!day || !section || !hydratedDraft || isComplete) {
      return;
    }
    await saveSessionDraft({
      dayNumber: day.dayNumber,
      sectionIndex,
      sentenceIndex,
      repRound,
      remainingSeconds,
      sessionElapsedSeconds,
      savedAt: new Date().toISOString(),
    });
  }, [
    day,
    section,
    hydratedDraft,
    isComplete,
    sectionIndex,
    sentenceIndex,
    repRound,
    remainingSeconds,
    sessionElapsedSeconds,
  ]);

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
    if (isComplete) {
      return;
    }

    const intervalId = setInterval(() => {
      setRemainingSeconds((prev) => (prev <= 0 ? 0 : prev - 1));
      setSentenceShownSeconds((prev) => prev + 1);
      setSessionElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isComplete, sectionIndex]);

  useEffect(() => {
    if (!section) {
      return;
    }
    setRemainingSeconds(section.duration);
    setSentenceShownSeconds(0);
    setPatternRevealed(false);
    setAnkiFlipped(false);
    setPatternCompleted({});
  }, [section?.id]);

  useEffect(() => {
    setSentenceShownSeconds(0);
    setPatternRevealed(false);
    setAnkiFlipped(false);
  }, [sentenceIndex]);

  useEffect(() => {
    if (!day || hydratedDraft) {
      return;
    }

    let active = true;
    const hydrateDraft = async () => {
      const draft = await loadSessionDraft();
      if (!active) {
        return;
      }

      if (draft && draft.dayNumber === day.dayNumber) {
        restoreFromDraft({
          sectionIndex: draft.sectionIndex,
          sentenceIndex: draft.sentenceIndex,
          repRound: draft.repRound,
        });

        const safeSection = day.sections[Math.min(draft.sectionIndex, Math.max(0, day.sections.length - 1))];
        setRemainingSeconds(Math.min(draft.remainingSeconds, safeSection.duration));
        setSessionElapsedSeconds(draft.sessionElapsedSeconds);
      }

      setHydratedDraft(true);
    };

    void hydrateDraft();

    return () => {
      active = false;
    };
  }, [day, hydratedDraft, restoreFromDraft]);

  useEffect(() => {
    if (!day || !section || !hydratedDraft || isComplete) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void saveSessionDraft({
        dayNumber: day.dayNumber,
        sectionIndex,
        sentenceIndex,
        repRound,
        remainingSeconds,
        sessionElapsedSeconds,
        savedAt: new Date().toISOString(),
      });
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [
    day,
    section,
    hydratedDraft,
    isComplete,
    sectionIndex,
    sentenceIndex,
    repRound,
    draftRemainingBucket,
    draftElapsedBucket,
  ]);

  useEffect(() => {
    if (!isComplete || !day || progressSaved) {
      return;
    }

    let active = true;
    const persist = async () => {
      await completeSessionAndSave({
        completedDay: day.dayNumber,
        sessionSeconds: sessionElapsedSeconds,
        totalDays: allDays.length,
      });
      if (active) {
        setProgressSaved(true);
      }
    };

    void persist();

    return () => {
      active = false;
    };
  }, [isComplete, day, progressSaved, sessionElapsedSeconds, allDays.length]);

  useEffect(() => {
    if (!isComplete) {
      return;
    }
    void clearSessionDraft();
  }, [isComplete]);

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
    setPatternCompleted((prev) => ({ ...prev, [sentenceIndex]: true }));
    advancePatternCard();
  };

  const handleAnkiGrade = (_grade: 'again' | 'good' | 'easy') => {
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
          setRemainingSeconds(section.duration);
          setSentenceShownSeconds(0);
        }}
      />
    </SessionScaffold>
  );
}
