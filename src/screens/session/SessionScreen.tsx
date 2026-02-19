import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { loadDays } from '../../data/day-loader';
import { AppText } from '../../ui/AppText';
import { PrimaryButton } from '../../ui/PrimaryButton';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/tokens';
import type { SessionSectionType } from '../../data/day-model';
import { completeSessionAndSave } from '../../data/progress-store';
import { clearSessionDraft, loadSessionDraft, saveSessionDraft } from '../../data/session-draft-store';
import { useInterstitialOnComplete } from '../../ads/useInterstitialOnComplete';
import { BannerAdSlot } from '../../ads/BannerAdSlot';
import { blurActiveElement } from '../../utils/blurActiveElement';
import { SentenceSpeakerButton } from '../../ui/SentenceSpeakerButton';
import { sessionStyles } from './session.styles';

function formatSeconds(totalSeconds: number): string {
  const safe = Math.max(totalSeconds, 0);
  const minutes = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (safe % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function isRepEnforcedSection(type: SessionSectionType): boolean {
  return type === 'warmup' || type === 'verbs' || type === 'sentences' || type === 'modals';
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

  const [sectionIndex, setSectionIndex] = useState(0);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [repRound, setRepRound] = useState(1);
  const [remainingSeconds, setRemainingSeconds] = useState(day?.sections[0]?.duration ?? 0);
  const [sentenceShownSeconds, setSentenceShownSeconds] = useState(0);
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState(0);
  const [patternRevealed, setPatternRevealed] = useState(false);
  const [ankiFlipped, setAnkiFlipped] = useState(false);
  const [patternCompleted, setPatternCompleted] = useState<Record<number, true>>({});
  const [progressSaved, setProgressSaved] = useState(false);
  const [hydratedDraft, setHydratedDraft] = useState(false);
  const [sectionTransition, setSectionTransition] = useState<{
    completedTitle: string;
    nextSectionIndex: number;
    nextTitle: string;
    nextType: SessionSectionType;
  } | null>(null);

  const sections = day?.sections ?? [];
  const section = sections[sectionIndex];
  const sentence = section?.sentences?.[sentenceIndex] ?? '';
  const isComplete = sectionIndex >= sections.length;
  const showInterstitialIfReady = useInterstitialOnComplete();
  const isWarmupSection = section?.type === 'warmup';
  const isRepEnforced = !!section && isRepEnforcedSection(section.type);
  const isFreeSection = section?.type === 'free';
  const freePrompt = isFreeSection ? section.sentences[0] ?? '' : '';
  const freeCues = isFreeSection ? section.sentences.slice(1) : [];
  const isPatternSection = section?.type === 'patterns';
  const isAnkiSection = section?.type === 'anki';
  const [patternPrompt, patternTarget] = isPatternSection ? sentence.split(' -> ').map((x) => x.trim()) : [sentence, sentence];
  const [ankiFront, ankiBack] = isAnkiSection ? sentence.split(' -> ').map((x) => x.trim()) : [sentence, sentence];
  const speechText = isPatternSection ? patternTarget : isAnkiSection ? ankiBack : sentence;

  const sectionHints: Record<SessionSectionType, string> = {
    warmup: 'Repeat each line aloud with rhythm and confidence.',
    verbs: 'Speak each verb form clearly and keep a steady pace.',
    sentences: 'Say each sentence naturally and fully.',
    modals: 'Focus on modal clarity and sentence order.',
    patterns: 'EN to DE flashcard flow: speak first, then reveal/check.',
    anki: 'Grade each card: Again, Good, or Easy.',
    free: 'Speak non-stop until timer ends using the prompt and cues.',
  };

  const nextSectionExpectations: Record<SessionSectionType, string> = {
    warmup: 'You will repeat short anchor phrases in a loop.',
    verbs: 'You will cycle through core verb forms over multiple rounds.',
    sentences: 'You will practice full example sentences over multiple rounds.',
    modals: 'You will drill modal constructions over multiple rounds.',
    patterns: 'You will do EN -> DE reveal-and-complete pattern cards.',
    anki: 'You will review cards and grade each one: Again, Good, or Easy.',
    free: 'You will speak continuously from prompts until timer ends.',
  };

  const advanceToNextSection = () => {
    if (!section) {
      return;
    }

    const isLastSection = sectionIndex >= sections.length - 1;
    if (isLastSection) {
      setSectionIndex(sections.length);
      return;
    }

    const nextSectionIndex = sectionIndex + 1;
    const nextSection = sections[nextSectionIndex];
    setSectionTransition({
      completedTitle: section.title,
      nextSectionIndex,
      nextTitle: nextSection.title,
      nextType: nextSection.type,
    });
  };

  const handleCloseSession = () => {
    blurActiveElement();
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
    setSentenceIndex(0);
    setRepRound(1);
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
        const safeSectionIndex = Math.min(draft.sectionIndex, Math.max(0, day.sections.length - 1));
        const safeSection = day.sections[safeSectionIndex];
        const safeSentenceIndex = Math.min(draft.sentenceIndex, Math.max(0, safeSection.sentences.length - 1));

        setSectionIndex(safeSectionIndex);
        setSentenceIndex(safeSentenceIndex);
        setRepRound(draft.repRound ?? 1);
        setRemainingSeconds(Math.min(draft.remainingSeconds, safeSection.duration));
        setSessionElapsedSeconds(draft.sessionElapsedSeconds);
      }

      setHydratedDraft(true);
    };

    void hydrateDraft();

    return () => {
      active = false;
    };
  }, [day, hydratedDraft]);

  useEffect(() => {
    if (!day || !section || !hydratedDraft || isComplete) {
      return;
    }

    void saveSessionDraft({
      dayNumber: day.dayNumber,
      sectionIndex,
      sentenceIndex,
      repRound,
      remainingSeconds,
      sessionElapsedSeconds,
      savedAt: new Date().toISOString(),
    });
  }, [day, section, hydratedDraft, isComplete, sectionIndex, sentenceIndex, repRound, remainingSeconds, sessionElapsedSeconds]);

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
    if (!section || !isWarmupSection || remainingSeconds > 0) {
      return;
    }

    advanceToNextSection();
  }, [section, isWarmupSection, remainingSeconds, sectionIndex, sections.length]);

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

  const advanceSentenceOrSection = () => {
    if (!section) {
      return;
    }

    if (isRepEnforced) {
      const isLastSentenceInRound = sentenceIndex >= section.sentences.length - 1;
      if (!isLastSentenceInRound) {
        setSentenceIndex((prev) => prev + 1);
        return;
      }

      if (repRound < section.reps) {
        setSentenceIndex(0);
        setRepRound((prev) => prev + 1);
        return;
      }

      if (isWarmupSection) {
        // Warm-up keeps looping by rounds until its section timer expires.
        setSentenceIndex(0);
        setRepRound(1);
        return;
      }

      advanceToNextSection();
      return;
    }

    const isLastSentence = sentenceIndex >= section.sentences.length - 1;
    if (!isLastSentence) {
      setSentenceIndex((prev) => prev + 1);
      return;
    }

    const isLastSection = sectionIndex >= sections.length - 1;
    if (isLastSection) {
      setSectionIndex(sections.length);
      return;
    }

    setSectionIndex((prev) => prev + 1);
  };

  const handleMarkPatternComplete = () => {
    setPatternCompleted((prev) => ({ ...prev, [sentenceIndex]: true }));
    const isLastSentence = sentenceIndex >= (section?.sentences.length ?? 1) - 1;
    if (isLastSentence) {
      setSectionIndex((prev) => prev + 1);
      return;
    }
    setSentenceIndex((prev) => prev + 1);
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
            onPress={() => {
              setSectionIndex(sectionTransition.nextSectionIndex);
              setSectionTransition(null);
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

  return (
    <Screen style={sessionStyles.container}>
      <View style={sessionStyles.header}>
        <View style={sessionStyles.headerSide}>
          <Pressable hitSlop={12} onPress={handleCloseSession}>
            <AppText variant="bodySecondary">Close</AppText>
          </Pressable>
        </View>

        <View style={sessionStyles.headerCenter}>
          <AppText variant="bodyPrimary" style={{ fontWeight: '700' }}>
            {section.title}
          </AppText>
        </View>

        <View style={sessionStyles.headerSide} />
      </View>

      <View style={sessionStyles.sectionMeta}>
        <AppText variant="bodySecondary" center>
          Section {sectionIndex + 1}/{sections.length} - {section.type}
        </AppText>
        <AppText variant="caption" center muted>
          {isFreeSection
            ? 'Free output timer running'
            : isRepEnforced
              ? `Round ${repRound}/${section.reps} - Sentence ${sentenceIndex + 1}/${section.sentences.length}`
              : `Sentence ${sentenceIndex + 1}/${section.sentences.length} - x${section.reps} reps`}
        </AppText>
      </View>

      <View style={sessionStyles.sentenceCard}>
        <SentenceSpeakerButton text={speechText} style={sessionStyles.speakerButton} />
        {isPatternSection && patternRevealed ? (
          <>
            <AppText variant="caption" muted center style={sessionStyles.sentence}>
              {patternPrompt}
            </AppText>
            <AppText
              variant="cardTitle"
              center
              style={[sessionStyles.sentence, { color: colors.accentSuccess, fontWeight: '700', marginTop: 8 }]}
            >
              {patternTarget}
            </AppText>
          </>
        ) : (
          <>
            {isAnkiSection && ankiFlipped ? (
              <>
                <AppText variant="caption" muted center style={sessionStyles.sentence}>
                  {ankiFront}
                </AppText>
                <AppText
                  variant="cardTitle"
                  center
                  style={[sessionStyles.sentence, { color: colors.accentSuccess, fontWeight: '700', marginTop: 8 }]}
                >
                  {ankiBack}
                </AppText>
              </>
            ) : (
              <AppText variant="cardTitle" style={sessionStyles.sentence}>
                {isFreeSection ? freePrompt : isPatternSection ? patternPrompt : isAnkiSection ? ankiFront : sentence}
              </AppText>
            )}
          </>
        )}
        {isPatternSection && !patternRevealed ? (
          <AppText variant="caption" muted center style={sessionStyles.helperText}>
            Speak your German translation aloud, then tap Reveal.
          </AppText>
        ) : null}
        {isAnkiSection && !ankiFlipped ? (
          <AppText variant="caption" muted center style={sessionStyles.helperText}>
            Read the front, say the German out loud, then tap Flip.
          </AppText>
        ) : null}
        {section.type === 'free' && freeCues.length > 0 ? (
          <View style={sessionStyles.cueWrap}>
            <AppText variant="caption" muted center>
              Cue words:
            </AppText>
            {freeCues.map((cue) => (
              <AppText key={cue} variant="bodySecondary" center>
                {cue}
              </AppText>
            ))}
          </View>
        ) : null}
        <AppText variant="caption" muted center style={{ marginTop: 8 }}>
          Text shown: {formatSeconds(sentenceShownSeconds)}
        </AppText>
      </View>

      <View style={sessionStyles.timerWrap}>
        <AppText variant="timer" style={{ color: timerColor }}>
          {formatSeconds(remainingSeconds)}
        </AppText>
        <AppText variant="caption" muted>
          Remaining in section
        </AppText>
      </View>

      <View style={sessionStyles.actionBar}>
        <AppText variant="caption" muted center>
          {sectionHints[section.type]}
        </AppText>
        {section.type === 'anki' ? (
          !ankiFlipped ? (
            <PrimaryButton label="Flip" size="cta" onPress={() => setAnkiFlipped(true)} />
          ) : (
            <View style={sessionStyles.rowActions}>
              <View style={sessionStyles.rowActionItem}>
                <PrimaryButton label="Again" onPress={() => handleAnkiGrade('again')} />
              </View>
              <View style={sessionStyles.rowActionItem}>
                <PrimaryButton label="Good" onPress={() => handleAnkiGrade('good')} />
              </View>
              <View style={sessionStyles.rowActionItem}>
                <PrimaryButton label="Easy" onPress={() => handleAnkiGrade('easy')} />
              </View>
            </View>
          )
        ) : section.type === 'patterns' ? (
          <>
            <PrimaryButton
              label={patternRevealed ? '✓ Mark Complete' : 'Reveal'}
              size="cta"
              onPress={() => {
                if (!patternRevealed) {
                  setPatternRevealed(true);
                  return;
                }
                handleMarkPatternComplete();
              }}
            />
            {patternCompleted[sentenceIndex] ? (
              <AppText variant="caption" center muted>
                Marked complete
              </AppText>
            ) : null}
          </>
        ) : (
          <PrimaryButton
            label={
              section.type === 'free'
                ? 'Finish Free Output'
                : isRepEnforced
                  ? `Next Sentence (Round ${repRound}/${section.reps})`
                  : 'Next'
            }
            size="cta"
            onPress={() => {
              if (section.type === 'free') {
                advanceToNextSection();
                return;
              }
              advanceSentenceOrSection();
            }}
          />
        )}
        <Pressable style={sessionStyles.secondaryAction} onPress={advanceToNextSection}>
          <AppText variant="bodySecondary" center>
            I&apos;m confident - Next Section
          </AppText>
        </Pressable>
        <Pressable
          style={sessionStyles.secondaryAction}
          onPress={() => {
            setRemainingSeconds(section.duration);
            setSentenceShownSeconds(0);
          }}
        >
          <AppText variant="bodySecondary" center>
            Restart timer
          </AppText>
        </Pressable>
      </View>
      <View style={sessionStyles.bannerWrap}>
        <View style={sessionStyles.bannerBox}>
          <BannerAdSlot />
        </View>
      </View>
    </Screen>
  );
}
