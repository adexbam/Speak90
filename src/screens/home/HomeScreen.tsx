import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { loadDays } from '../../data/day-loader';
import { loadUserProgress, type UserProgress } from '../../data/progress-store';
import { clearSessionDraft, loadSessionDraft, type SessionDraft } from '../../data/session-draft-store';
import { AppText } from '../../ui/AppText';
import { Card } from '../../ui/Card';
import { PrimaryButton } from '../../ui/PrimaryButton';
import { Screen } from '../../ui/Screen';
import { BannerAdSlot } from '../../ads/BannerAdSlot';
import { blurActiveElement } from '../../utils/blurActiveElement';
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
  const [sessionDraft, setSessionDraft] = useState<SessionDraft | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadProgress = async () => {
        const [next, draft] = await Promise.all([loadUserProgress(), loadSessionDraft()]);
        if (active) {
          setProgress(next);
          setSessionDraft(draft);
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
  const hasResumeForCurrentDay = !!sessionDraft && sessionDraft.dayNumber === currentDay;

  const goToSession = () => {
    blurActiveElement();
    router.push({ pathname: '/session', params: { day: String(currentDay) } });
  };

  return (
    <Screen style={homeStyles.container}>
      <View style={homeStyles.titleWrap}>
        <AppText variant="screenTitle" center>
          speak90
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
        {hasResumeForCurrentDay ? (
          <View style={homeStyles.resumeCard}>
            <AppText variant="bodySecondary" center>
              You have an in-progress session for Day {currentDay}.
            </AppText>
            <PrimaryButton label="Continue Session" size="cta" onPress={goToSession} />
            <Pressable
              onPress={async () => {
                await clearSessionDraft();
                setSessionDraft(null);
                goToSession();
              }}
            >
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
