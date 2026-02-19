// src/screens/session/SessionScreen.tsx
import React from 'react';
import { Pressable, View } from 'react-native';
import { Screen } from '../ui/Screen';
import { AppText } from '../ui/AppText';
import { PrimaryButton } from '../ui/PrimaryButton';
import { sessionStyles } from './session.styles';
import { timerStyles } from '../ui/timer.styles';

export function SessionScreen() {
  const remainingSeconds = 28; // wire from store
  const timerVariant =
    remainingSeconds === 0 ? timerStyles.complete :
    remainingSeconds <= 10 ? timerStyles.warning :
    timerStyles.normal;

  return (
    <Screen style={sessionStyles.container}>
      <View style={sessionStyles.header}>
        <View style={sessionStyles.headerSide}>
          <Pressable hitSlop={12}>
            <AppText variant="bodySecondary">X</AppText>
          </Pressable>
        </View>

        <View style={sessionStyles.headerCenter}>
          <AppText variant="bodyPrimary" style={{ fontWeight: '700' }}>Warm-up</AppText>
        </View>

        <View style={sessionStyles.headerSide} />
      </View>

      <View style={sessionStyles.sectionMeta}>
        <AppText variant="bodySecondary" center>
          Warm-up (5min) • 4 sentences • x5 reps
        </AppText>
        <AppText variant="caption" center muted>2/4 sentences</AppText>
      </View>

      <View style={sessionStyles.promptCard}>
        <AppText variant="cardTitle" style={sessionStyles.sentence}>
          Ich weiß nicht.
        </AppText>
      </View>

      <View style={sessionStyles.timerWrap}>
        <AppText variant="timer" style={timerVariant}>00:28</AppText>
        <AppText variant="caption" muted>Remaining</AppText>
      </View>

      <View style={sessionStyles.actionBar}>
        <PrimaryButton label="✓ Next" onPress={() => {}} size="cta" />
        <Pressable style={sessionStyles.secondaryAction}>
          <AppText variant="bodySecondary" center>Restart timer</AppText>
        </Pressable>
      </View>
    </Screen>
  );
}
