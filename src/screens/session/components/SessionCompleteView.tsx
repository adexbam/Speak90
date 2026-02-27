import React from 'react';
import { View } from 'react-native';
import { AppText } from '../../../ui/AppText';
import { PrimaryButton } from '../../../ui/PrimaryButton';
import { Screen } from '../../../ui/Screen';
import { sessionStyles } from '../session.styles';
import { SessionBannerFooter } from './SessionBannerFooter';

type SessionCompleteViewProps = {
  dayNumber: number;
  elapsedLabel: string;
  progressSaved: boolean;
  isPracticeMode: boolean;
  onViewStats: () => Promise<void>;
  onBackHome: () => Promise<void>;
};

export function SessionCompleteView({
  dayNumber,
  elapsedLabel,
  progressSaved,
  isPracticeMode,
  onViewStats,
  onBackHome,
}: SessionCompleteViewProps) {
  return (
    <Screen style={sessionStyles.container}>
      <View style={sessionStyles.completeWrap}>
        <AppText variant="screenTitle" center>
          Session Complete
        </AppText>
        <AppText variant="bodySecondary" center>
          {isPracticeMode ? `Practice complete for Day ${dayNumber}.` : `You completed Day ${dayNumber}.`}
        </AppText>
        <AppText variant="cardTitle" center>
          Total elapsed: {elapsedLabel}
        </AppText>
        <AppText variant="caption" center muted>
          Saved as elapsed session time in progress stats.
        </AppText>
        {!progressSaved ? (
          <AppText variant="caption" center muted>
            Saving progress...
          </AppText>
        ) : null}
        <PrimaryButton
          label="View Stats"
          onPress={() => {
            void onViewStats();
          }}
          disabled={!progressSaved}
        />
        <PrimaryButton
          label="Back Home"
          onPress={() => {
            void onBackHome();
          }}
          disabled={!progressSaved}
        />
      </View>
      <SessionBannerFooter />
    </Screen>
  );
}
