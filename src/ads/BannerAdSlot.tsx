import React from 'react';
import { View } from 'react-native';
import { AppText } from '../ui/AppText';

type BannerAdSlotProps = {
  fallbackText?: string;
};

export function BannerAdSlot({ fallbackText = 'Banner Ad Placeholder' }: BannerAdSlotProps) {
  return (
    <View style={{ minHeight: 56, alignItems: 'center', justifyContent: 'center' }}>
      <AppText variant="caption" center muted>
        {fallbackText}
      </AppText>
    </View>
  );
}
