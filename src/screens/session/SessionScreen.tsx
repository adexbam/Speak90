import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { getDayByNumber } from '../../data/day-loader';
import { AppText } from '../../ui/AppText';
import { PrimaryButton } from '../../ui/PrimaryButton';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/tokens';
import type { SessionSectionType } from '../../data/day-model';
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
  const day = useMemo(() => getDayByNumber(1), []);

  const [sectionIndex, setSectionIndex] = useState(0);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(day?.sections[0]?.duration ?? 0);
  const [sentenceShownSeconds, setSentenceShownSeconds] = useState(0);
  const [patternRevealed, setPatternRevealed] = useState(false);
  const [patternCompleted, setPatternCompleted] = useState<Record<number, true>>({});

  const sections = day?.sections ?? [];
  const section = sections[sectionIndex];
  const sentence = section?.sentences?.[sentenceIndex] ?? '';
  const isComplete = sectionIndex >= sections.length;
  const isFreeSection = section?.type === 'free';
  const freePrompt = isFreeSection ? section.sentences[0] ?? '' : '';
  const freeCues = isFreeSection ? section.sentences.slice(1) : [];

  useEffect(() => {
    if (isComplete) {
      return;
    }

    const intervalId = setInterval(() => {
      setRemainingSeconds((prev) => (prev <= 0 ? 0 : prev - 1));
      setSentenceShownSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isComplete, sectionIndex]);

  useEffect(() => {
    if (!section) {
      return;
    }
    setRemainingSeconds(section.duration);
    setSentenceIndex(0);
    setSentenceShownSeconds(0);
    setPatternRevealed(false);
    setPatternCompleted({});
  }, [section?.id]);

  useEffect(() => {
    setSentenceShownSeconds(0);
    setPatternRevealed(false);
  }, [sentenceIndex]);

  if (!day) {
    return (
      <Screen style={sessionStyles.container}>
        <View style={sessionStyles.completeWrap}>
          <AppText variant="cardTitle" center>
            Session data missing
          </AppText>
          <PrimaryButton label="Back Home" onPress={() => router.replace('/')} />
        </View>
      </Screen>
    );
  }

  const advanceSentenceOrSection = () => {
    if (!section) {
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

  const sectionHints: Record<SessionSectionType, string> = {
    warmup: 'Repeat each line aloud with rhythm and confidence.',
    verbs: 'Speak each verb form clearly and keep a steady pace.',
    sentences: 'Say each sentence naturally and fully.',
    modals: 'Focus on modal clarity and sentence order.',
    patterns: 'EN to DE flashcard flow: speak first, then reveal/check.',
    anki: 'Grade each card: Again, Good, or Easy.',
    free: 'Speak non-stop until timer ends using the prompt and cues.',
  };

  if (isComplete) {
    return (
      <Screen style={sessionStyles.container}>
        <View style={sessionStyles.completeWrap}>
          <AppText variant="screenTitle" center>
            Session Complete
          </AppText>
          <AppText variant="bodySecondary" center>
            You completed Day {day.dayNumber}.
          </AppText>
          <PrimaryButton label="Back Home" onPress={() => router.replace('/')} />
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
          <Pressable hitSlop={12} onPress={() => router.back()}>
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
            : `Sentence ${sentenceIndex + 1}/${section.sentences.length} - x${section.reps} reps`}
        </AppText>
      </View>

      <View style={sessionStyles.sentenceCard}>
        <AppText variant="cardTitle" style={sessionStyles.sentence}>
          {isFreeSection ? freePrompt : sentence}
        </AppText>
        {section.type === 'patterns' && !patternRevealed ? (
          <AppText variant="caption" muted center style={sessionStyles.helperText}>
            Speak your German translation aloud, then tap Reveal.
          </AppText>
        ) : null}
        {section.type === 'patterns' && patternRevealed ? (
          <AppText variant="caption" muted center style={sessionStyles.helperText}>
            Target: {sentence}
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
            label={section.type === 'free' ? 'Finish Free Output' : 'Next'}
            size="cta"
            onPress={() => {
              if (section.type === 'free') {
                setSectionIndex((prev) => prev + 1);
                return;
              }
              advanceSentenceOrSection();
            }}
          />
        )}
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
    </Screen>
  );
}
