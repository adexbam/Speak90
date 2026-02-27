import React from 'react';
import { View } from 'react-native';
import { AppText } from '../../../ui/AppText';
import { Card } from '../../../ui/Card';
import { homeStyles } from '../home.styles';

type HomeProgressCardProps = {
  currentDay: number;
  streak: number;
  averageMinutes: number;
  totalMinutes: number;
  todayModeLabel: string;
  reinforcementReviewDay?: number | null;
};

export function HomeProgressCard({
  currentDay,
  streak,
  averageMinutes,
  totalMinutes,
  todayModeLabel,
  reinforcementReviewDay,
}: HomeProgressCardProps) {
  return (
    <Card elevated style={homeStyles.progressCard}>
      <AppText variant="cardTitle">Day {currentDay} • Streak: {streak} 🔥 • {averageMinutes}min avg</AppText>
      <View style={homeStyles.progressRow}>
        <AppText variant="caption" muted>
          Goal: complete today&apos;s full session
        </AppText>
      </View>
      <View style={homeStyles.progressRow}>
        <AppText variant="caption" muted>
          Total time spent: {totalMinutes} min
        </AppText>
      </View>
      <View style={homeStyles.progressRow}>
        <AppText variant="caption" muted>
          Today&apos;s mode: {todayModeLabel}
          {reinforcementReviewDay ? ` • Reinforce Day ${reinforcementReviewDay}` : ''}
        </AppText>
      </View>
    </Card>
  );
}
