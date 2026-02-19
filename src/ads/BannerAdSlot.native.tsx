import React, { useState } from 'react';
import { View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { AppText } from '../ui/AppText';

type BannerAdSlotProps = {
  fallbackText?: string;
};

const bannerFromEnv = process.env.EXPO_PUBLIC_ADMOB_BANNER_ID;
const bannerAdUnitId = __DEV__ ? TestIds.BANNER : bannerFromEnv;

export function BannerAdSlot({ fallbackText = 'Banner Ad Placeholder' }: BannerAdSlotProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !bannerAdUnitId) {
    return (
      <View style={{ minHeight: 56, alignItems: 'center', justifyContent: 'center' }}>
        <AppText variant="caption" center muted>
          {fallbackText}
        </AppText>
      </View>
    );
  }

  return (
    <BannerAd
      unitId={bannerAdUnitId}
      size={BannerAdSize.BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      onAdFailedToLoad={() => setFailed(true)}
    />
  );
}
