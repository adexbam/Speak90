import React from 'react';
import { View } from 'react-native';
import { BannerAdSlot } from '../../../ads/BannerAdSlot';
import { sessionStyles } from '../session.styles';

export function SessionBannerFooter() {
  return (
    <View style={sessionStyles.bannerWrap}>
      <View style={sessionStyles.bannerBox}>
        <BannerAdSlot />
      </View>
    </View>
  );
}
