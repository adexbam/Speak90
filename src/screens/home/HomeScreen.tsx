import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { loadDays } from '../../data/day-loader';
import { loadUserProgress, type UserProgress } from '../../data/progress-store';
import { AppText } from '../../ui/AppText';
import { Card } from '../../ui/Card';
import { PrimaryButton } from '../../ui/PrimaryButton';
import { Screen } from '../../ui/Screen';
import { homeStyles } from './home.styles';

export function HomeScreen() {
  const router = useRouter();

  const days = useMemo(() => loadDays(), []);
  const [progress, setProgress] = useState<UserProgress>({
    currentDay: 1,
    streak: 0,
    sessionsCompleted: [],
    totalMinutes: 0,
  });

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadProgress = async () => {
        const next = await loadUserProgress();
        if (active) {
          setProgress(next);
        }
      };

      void loadProgress();

      return () => {
        active = false;
      };
    }, [])
  );

  const currentDay = Math.min(progress.currentDay, days.length || 1);
  const streak = progress.streak;

  return (
    <Screen style={homeStyles.container}>
      <View style={homeStyles.titleWrap}>
        <AppText variant="screenTitle" center>
          Speak90
        </AppText>
      </View>

      <Card elevated style={homeStyles.progressCard}>
        <AppText variant="cardTitle">Day {currentDay}</AppText>

        <View style={homeStyles.progressRow}>
          <AppText variant="bodySecondary">Streak: {streak} days</AppText>
        </View>

        <View style={homeStyles.progressRow}>
          <AppText variant="caption" muted>
            Goal: complete today&apos;s full session ({progress.totalMinutes} min total)
          </AppText>
        </View>
      </Card>

      <View style={homeStyles.startWrap}>
        <PrimaryButton
          label="Start Session"
          size="cta"
          onPress={() => router.push({ pathname: '/session', params: { day: String(currentDay) } })}
        />
      </View>

      <View style={homeStyles.bannerWrap}>
        <View style={homeStyles.bannerBox}>
          <AppText variant="caption" center muted>
            Banner Ad Placeholder
          </AppText>
        </View>
      </View>
    </Screen>
  );
}
