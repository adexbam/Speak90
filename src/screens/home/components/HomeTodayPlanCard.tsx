import React from 'react';
import { View } from 'react-native';
import { AppText } from '../../../ui/AppText';
import { Card } from '../../../ui/Card';
import { homeStyles } from '../home.styles';

type HomeTodayPlanCardProps = {
  todayModeLabel: string;
  todayModeDurationLabel: string;
  todayChecklist: string[];
  reviewGuardrailMessage: string | null;
};

export function HomeTodayPlanCard({
  todayModeLabel,
  todayModeDurationLabel,
  todayChecklist,
  reviewGuardrailMessage,
}: HomeTodayPlanCardProps) {
  return (
    <Card elevated style={homeStyles.planCard}>
      <AppText variant="cardTitle">Today&apos;s Plan</AppText>
      <AppText variant="caption" muted>
        Mode: {todayModeLabel} • Expected: {todayModeDurationLabel}
      </AppText>
      <View style={homeStyles.planChecklist}>
        {todayChecklist.map((item) => (
          <View key={item} style={homeStyles.planChecklistItem}>
            <AppText variant="bodySecondary">• {item}</AppText>
          </View>
        ))}
      </View>
      {reviewGuardrailMessage ? (
        <AppText variant="caption" muted>
          Guardrail (70/30): {reviewGuardrailMessage}
        </AppText>
      ) : null}
    </Card>
  );
}
