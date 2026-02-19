import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { getDayByNumber } from '../../data/day-loader';
import { AppText } from '../../ui/AppText';
import { PrimaryButton } from '../../ui/PrimaryButton';
import { Screen } from '../../ui/Screen';
import { colors } from '../../ui/tokens';
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

  const sections = day?.sections ?? [];
  const section = sections[sectionIndex];
  const sentence = section?.sentences?.[sentenceIndex] ?? '';
  const isComplete = sectionIndex >= sections.length;

  useEffect(() => {
    if (isComplete) {
      return;
    }

    const intervalId = setInterval(() => {
      setRemainingSeconds((prev) => (prev <= 0 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isComplete, sectionIndex]);

  useEffect(() => {
    if (!section) {
      return;
    }
    setRemainingSeconds(section.duration);
    setSentenceIndex(0);
  }, [section?.id]);

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

  const handleNext = () => {
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
          Sentence {sentenceIndex + 1}/{section.sentences.length} - x{section.reps} reps
        </AppText>
      </View>

      <View style={sessionStyles.sentenceCard}>
        <AppText variant="cardTitle" style={sessionStyles.sentence}>
          {sentence}
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
        <PrimaryButton label="Next" size="cta" onPress={handleNext} />
        <Pressable style={sessionStyles.secondaryAction} onPress={() => setRemainingSeconds(section.duration)}>
          <AppText variant="bodySecondary" center>
            Restart timer
          </AppText>
        </Pressable>
      </View>
    </Screen>
  );
}
