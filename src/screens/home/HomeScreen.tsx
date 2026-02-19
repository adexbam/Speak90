import React, { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { loadDays } from '../../data/day-loader';
import { AppText } from '../../ui/AppText';
import { Card } from '../../ui/Card';
import { PrimaryButton } from '../../ui/PrimaryButton';
import { Screen } from '../../ui/Screen';
import { homeStyles } from './home.styles';

export function HomeScreen() {
  const router = useRouter();

  const days = useMemo(() => loadDays(), []);
  const currentDay = days[0]?.dayNumber ?? 1;
  const streak = 0;

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
            Goal: complete today&apos;s full session
          </AppText>
        </View>
      </Card>

      <View style={homeStyles.startWrap}>
        <PrimaryButton label="Start Session" size="cta" onPress={() => router.push('/session')} />
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
