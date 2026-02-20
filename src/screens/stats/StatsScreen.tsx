import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { BannerAdSlot } from '../../ads/BannerAdSlot';
import { loadUserProgress, type UserProgress } from '../../data/progress-store';
import { loadSrsCards, type SrsCard } from '../../data/srs-store';
import { AppText } from '../../ui/AppText';
import { Card } from '../../ui/Card';
import { PrimaryButton } from '../../ui/PrimaryButton';
import { Screen } from '../../ui/Screen';
import { computeSrsMetrics } from './stats-metrics';
import { statsStyles } from './stats.styles';

const EMPTY_PROGRESS: UserProgress = {
  currentDay: 1,
  streak: 0,
  sessionsCompleted: [],
  totalMinutes: 0,
};

export function StatsScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<UserProgress>(EMPTY_PROGRESS);
  const [srsCards, setSrsCards] = useState<SrsCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [loadedProgress, loadedSrsCards] = await Promise.all([loadUserProgress(), loadSrsCards()]);
      if (!active) {
        return;
      }
      setProgress(loadedProgress);
      setSrsCards(loadedSrsCards);
      setLoading(false);
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const srsMetrics = useMemo(() => computeSrsMetrics(srsCards), [srsCards]);

  return (
    <Screen style={statsStyles.container} scrollable>
      <View style={statsStyles.titleWrap}>
        <AppText variant="screenTitle" center>
          Stats
        </AppText>
      </View>

      {loading ? (
        <View style={statsStyles.cardsWrap}>
          <AppText variant="caption" center muted>
            Loading stats...
          </AppText>
        </View>
      ) : (
        <View style={statsStyles.cardsWrap}>
          <Card elevated style={statsStyles.card}>
            <AppText variant="cardTitle">Session Metrics</AppText>
            <View style={statsStyles.row}>
              <AppText variant="bodySecondary">Streak</AppText>
              <AppText variant="bodyPrimary">{progress.streak} 🔥</AppText>
            </View>
            <View style={statsStyles.row}>
              <AppText variant="bodySecondary">Sessions Completed</AppText>
              <AppText variant="bodyPrimary">{progress.sessionsCompleted.length}</AppText>
            </View>
            <View style={statsStyles.row}>
              <AppText variant="bodySecondary">Total Elapsed Minutes</AppText>
              <AppText variant="bodyPrimary">{progress.totalMinutes}</AppText>
            </View>
          </Card>

          <Card elevated style={statsStyles.card}>
            <AppText variant="cardTitle">SRS Metrics</AppText>
            <View style={statsStyles.row}>
              <AppText variant="bodySecondary">Due Today</AppText>
              <AppText variant="bodyPrimary">{srsMetrics.dueToday}</AppText>
            </View>
            <View style={statsStyles.row}>
              <AppText variant="bodySecondary">Cards Reviewed</AppText>
              <AppText variant="bodyPrimary">{srsMetrics.reviewedCards}</AppText>
            </View>
            <View style={statsStyles.row}>
              <AppText variant="bodySecondary">Review Outcomes</AppText>
              <AppText variant="bodyPrimary">
                {srsMetrics.totalSuccess}/{srsMetrics.totalReviews}
              </AppText>
            </View>
            <View style={statsStyles.row}>
              <AppText variant="bodySecondary">Accuracy (Summary)</AppText>
              <AppText variant="bodyPrimary">{srsMetrics.accuracyPercent}%</AppText>
            </View>
            <View style={statsStyles.row}>
              <AppText variant="bodySecondary">Box 1 / 2 / 3 / 4 / 5</AppText>
              <AppText variant="bodyPrimary">
                {(srsMetrics.boxCounts[1] ?? 0)}/{(srsMetrics.boxCounts[2] ?? 0)}/{(srsMetrics.boxCounts[3] ?? 0)}/
                {(srsMetrics.boxCounts[4] ?? 0)}/{(srsMetrics.boxCounts[5] ?? 0)}
              </AppText>
            </View>
          </Card>
        </View>
      )}

      <View style={statsStyles.buttonWrap}>
        <PrimaryButton
          label="Back Home"
          onPress={() => {
            router.replace('/');
          }}
        />
      </View>

      <View style={statsStyles.bannerWrap}>
        <View style={statsStyles.bannerBox}>
          <BannerAdSlot />
        </View>
      </View>
    </Screen>
  );
}
