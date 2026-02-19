import React, { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Platform, Pressable, View } from 'react-native';
import { loadDays } from '../../data/day-loader';
import { AppText } from '../../ui/AppText';
import { Card } from '../../ui/Card';
import { PrimaryButton } from '../../ui/PrimaryButton';
import { Screen } from '../../ui/Screen';
import { BannerAdSlot } from '../../ads/BannerAdSlot';
import { blurActiveElement } from '../../utils/blurActiveElement';
import { useHomeProgress } from './useHomeProgress';
import { homeStyles } from './home.styles';

export function HomeScreen() {
  const router = useRouter();

  const days = useMemo(() => loadDays(), []);
  const { progress, currentDay, hasResumeForCurrentDay, startOver } = useHomeProgress({ totalDays: days.length });
  const streak = progress.streak;
  const averageMinutes = progress.sessionsCompleted.length > 0 ? Math.round(progress.totalMinutes / progress.sessionsCompleted.length) : 0;

  const goToSession = () => {
    blurActiveElement();
    router.push({ pathname: '/session', params: { day: String(currentDay) } });
  };

  const confirmStartOver = () => {
    const proceed = async () => {
      await startOver();
      goToSession();
    };

    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm('Start over and lose your current session progress?') : false;
      if (ok) {
        void proceed();
      }
      return;
    }

    Alert.alert('Start Over?', 'You will lose your current in-progress session.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start Over',
        style: 'destructive',
        onPress: () => {
          void proceed();
        },
      },
    ]);
  };

  return (
    <Screen style={homeStyles.container}>
      <View style={homeStyles.titleWrap}>
        <AppText variant="screenTitle" center>
          speak90
        </AppText>
      </View>

      <Card elevated style={homeStyles.progressCard}>
        <AppText variant="cardTitle">Day {currentDay} • Streak: {streak} 🔥 • {averageMinutes}min avg</AppText>

        <View style={homeStyles.progressRow}>
          <AppText variant="caption" muted>
            Goal: complete today&apos;s full session ({progress.totalMinutes} min total)
          </AppText>
        </View>
      </Card>

      <View style={homeStyles.startWrap}>
        {hasResumeForCurrentDay ? (
          <View style={homeStyles.resumeCard}>
            <AppText variant="bodySecondary" center>
              You have an in-progress session for Day {currentDay}.
            </AppText>
            <PrimaryButton label="Continue Session" size="cta" onPress={goToSession} />
            <Pressable onPress={confirmStartOver}>
              <AppText variant="bodySecondary" center>
                Start Over
              </AppText>
            </Pressable>
          </View>
        ) : (
          <PrimaryButton label="Start Session" size="cta" onPress={goToSession} />
        )}
      </View>

      <View style={homeStyles.bannerWrap}>
        <View style={homeStyles.bannerBox}>
          <BannerAdSlot />
        </View>
      </View>
    </Screen>
  );
}
