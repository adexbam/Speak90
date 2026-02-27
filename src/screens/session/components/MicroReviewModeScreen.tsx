import React from 'react';
import { View } from 'react-native';
import { BannerAdSlot } from '../../../ads/BannerAdSlot';
import type { SrsCard } from '../../../data/srs-store';
import { Screen } from '../../../ui/Screen';
import { sessionStyles } from '../session.styles';
import { MicroReviewRunner } from './MicroReviewRunner';

type MicroReviewModeScreenProps = {
  isLoading: boolean;
  cards: SrsCard[];
  memorySentences: string[];
  source: 'previous_day' | 'none';
  onContinue: () => void;
};

export function MicroReviewModeScreen({ isLoading, cards, memorySentences, source, onContinue }: MicroReviewModeScreenProps) {
  return (
    <Screen style={sessionStyles.container} scrollable>
      <MicroReviewRunner
        isLoading={isLoading}
        cards={cards}
        memorySentences={memorySentences}
        source={source}
        onContinue={onContinue}
      />
      <View style={sessionStyles.bannerWrap}>
        <View style={sessionStyles.bannerBox}>
          <BannerAdSlot />
        </View>
      </View>
    </Screen>
  );
}
