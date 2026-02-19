import React, { useEffect, useMemo, useState } from 'react';
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
import { clearAllRecordings } from '../../data/recordings-store';

export function HomeScreen() {
  const router = useRouter();
  const [clearFeedback, setClearFeedback] = useState<string | null>(null);

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

  const confirmClearRecordings = () => {
    const proceed = async () => {
      await clearAllRecordings();
      setClearFeedback('Recordings cleared.');
    };

    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm('Clear all local recordings from this device?') : false;
      if (ok) {
        void proceed();
      }
      return;
    }

    Alert.alert('Clear recordings?', 'This will delete all local recordings on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          void proceed();
        },
      },
    ]);
  };

  useEffect(() => {
    if (!clearFeedback) {
      return;
    }

    const timer = setTimeout(() => {
      setClearFeedback(null);
    }, 2500);

    return () => clearTimeout(timer);
  }, [clearFeedback]);

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
        <Pressable onPress={() => router.push('/stats')}>
          <AppText variant="bodySecondary" center>
            View Stats
          </AppText>
        </Pressable>
      </View>

      <View style={homeStyles.settingsWrap}>
        <Pressable onPress={confirmClearRecordings}>
          <AppText variant="bodySecondary" center>
            Clear Local Recordings
          </AppText>
        </Pressable>
        {clearFeedback ? (
          <AppText variant="caption" center>
            {clearFeedback}
          </AppText>
        ) : null}
      </View>

      <View style={homeStyles.bannerWrap}>
        <View style={homeStyles.bannerBox}>
          <BannerAdSlot />
        </View>
      </View>
    </Screen>
  );
}
