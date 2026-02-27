import React from 'react';
import { View } from 'react-native';
import { BannerAdSlot } from '../../../ads/BannerAdSlot';
import type { ReviewBlock } from '../../../data/review-plan-loader';
import { Screen } from '../../../ui/Screen';
import { sessionStyles } from '../session.styles';
import { LightReviewRunner } from './LightReviewRunner';

type LightReviewModeScreenProps = {
  blocks: ReviewBlock[];
  blockIndex: number;
  remainingSeconds: number;
  sessionElapsedSeconds: number;
  onNextBlock: () => void;
  onFinish: () => void;
};

export function LightReviewModeScreen({
  blocks,
  blockIndex,
  remainingSeconds,
  sessionElapsedSeconds,
  onNextBlock,
  onFinish,
}: LightReviewModeScreenProps) {
  return (
    <Screen style={sessionStyles.container} scrollable>
      <LightReviewRunner
        blocks={blocks}
        blockIndex={blockIndex}
        remainingSeconds={remainingSeconds}
        sessionElapsedSeconds={sessionElapsedSeconds}
        onNextBlock={onNextBlock}
        onFinish={onFinish}
      />
      <View style={sessionStyles.bannerWrap}>
        <View style={sessionStyles.bannerBox}>
          <BannerAdSlot />
        </View>
      </View>
    </Screen>
  );
}
