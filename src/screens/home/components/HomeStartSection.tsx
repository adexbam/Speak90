import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '../../../ui/AppText';
import { PrimaryButton } from '../../../ui/PrimaryButton';
import { homeStyles } from '../home.styles';

type HomeStartSectionProps = {
  canResumeTodayPlan: boolean;
  todayModeLabel: string;
  currentDay: number;
  onGoToSession: () => void;
  onStartOver: () => void;
  onViewStats: () => void;
};

export function HomeStartSection({
  canResumeTodayPlan,
  todayModeLabel,
  currentDay,
  onGoToSession,
  onStartOver,
  onViewStats,
}: HomeStartSectionProps) {
  return (
    <View style={homeStyles.startWrap}>
      {canResumeTodayPlan ? (
        <View style={homeStyles.resumeCard}>
          <AppText variant="bodySecondary" center>
            You have an in-progress {todayModeLabel.toLowerCase()} plan for Day {currentDay}.
          </AppText>
          <PrimaryButton label={`Continue ${todayModeLabel}`} size="cta" onPress={onGoToSession} />
          <Pressable onPress={onStartOver}>
            <AppText variant="bodySecondary" center style={homeStyles.linkLikeText}>
              Start Over
            </AppText>
          </Pressable>
        </View>
      ) : (
        <PrimaryButton label={`Start ${todayModeLabel}`} size="cta" onPress={onGoToSession} />
      )}
      <Pressable onPress={onViewStats} style={homeStyles.settingsActionChip}>
        <AppText variant="bodySecondary" center style={homeStyles.linkLikeText}>
          View Stats
        </AppText>
      </Pressable>
    </View>
  );
}
