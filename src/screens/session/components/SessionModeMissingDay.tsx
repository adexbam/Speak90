import React from 'react';
import { View } from 'react-native';
import { BannerAdSlot } from '../../../ads/BannerAdSlot';
import { AppText } from '../../../ui/AppText';
import { PrimaryButton } from '../../../ui/PrimaryButton';
import { Screen } from '../../../ui/Screen';
import { sessionStyles } from '../session.styles';

type SessionModeMissingDayProps = {
  onBackHome: () => void;
};

export function SessionModeMissingDay({ onBackHome }: SessionModeMissingDayProps) {
  return (
    <Screen style={sessionStyles.container}>
      <View style={sessionStyles.completeWrap}>
        <AppText variant="cardTitle" center>
          Session data missing
        </AppText>
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
