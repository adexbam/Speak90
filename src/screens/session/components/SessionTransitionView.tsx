import React from 'react';
import { View } from 'react-native';
import { AppText } from '../../../ui/AppText';
import { PrimaryButton } from '../../../ui/PrimaryButton';
import { Screen } from '../../../ui/Screen';
import { nextSectionExpectations } from '../session-copy';
import { sessionStyles } from '../session.styles';
import { SessionBannerFooter } from './SessionBannerFooter';
import type { SessionSectionType } from '../../../data/day-model';

type SessionTransitionViewProps = {
  completedTitle: string;
  nextTitle: string;
  nextType: SessionSectionType;
  onContinue: () => void;
};

export function SessionTransitionView({ completedTitle, nextTitle, nextType, onContinue }: SessionTransitionViewProps) {
  return (
    <Screen style={sessionStyles.container}>
      <View style={sessionStyles.completeWrap}>
        <AppText variant="screenTitle" center>
          Section Complete
        </AppText>
        <AppText variant="bodySecondary" center>
          Great work on {completedTitle}.
        </AppText>
        <AppText variant="cardTitle" center>
          Up next: {nextTitle}
        </AppText>
        <AppText variant="caption" center muted>
          {nextSectionExpectations[nextType]}
        </AppText>
        <PrimaryButton label="Continue to Next Section" onPress={onContinue} />
      </View>
      <SessionBannerFooter />
    </Screen>
  );
}
