import React from 'react';
import { View } from 'react-native';
import { BannerAdSlot } from '../../../ads/BannerAdSlot';
import { AppText } from '../../../ui/AppText';
import { PrimaryButton } from '../../../ui/PrimaryButton';
import { Screen } from '../../../ui/Screen';
import { sessionStyles } from '../session.styles';

type ModeCompleteScreenProps = {
  title: string;
  body: string;
  isSaving?: boolean;
  onBackHome: () => void;
};

export function ModeCompleteScreen({ title, body, isSaving, onBackHome }: ModeCompleteScreenProps) {
  return (
    <Screen style={sessionStyles.container}>
      <View style={sessionStyles.completeWrap}>
        <AppText variant="screenTitle" center>
          {title}
        </AppText>
        <AppText variant="bodySecondary" center>
          {body}
        </AppText>
        {isSaving ? (
          <AppText variant="caption" center muted>
            Saving completion...
          </AppText>
        ) : null}
        <PrimaryButton label="Back Home" onPress={onBackHome} />
      </View>
      <View style={sessionStyles.bannerWrap}>
        <View style={sessionStyles.bannerBox}>
          <BannerAdSlot />
        </View>
      </View>
    </Screen>
  );
}
