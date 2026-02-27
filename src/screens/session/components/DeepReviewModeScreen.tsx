import React from 'react';
import { View } from 'react-native';
import { BannerAdSlot } from '../../../ads/BannerAdSlot';
import type { ReviewBlock } from '../../../data/review-plan-loader';
import type { DeepVerbTarget } from '../../../review/deep-consolidation';
import { Screen } from '../../../ui/Screen';
import { sessionStyles } from '../session.styles';
import { DeepConsolidationRunner } from './DeepConsolidationRunner';

type DeepReviewModeScreenProps = {
  blocks: ReviewBlock[];
  blockIndex: number;
  remainingSeconds: number;
  sessionElapsedSeconds: number;
  verbTargets: DeepVerbTarget[];
  onNextBlock: () => void;
  onFinish: () => void;
};

export function DeepReviewModeScreen({
  blocks,
  blockIndex,
  remainingSeconds,
  sessionElapsedSeconds,
  verbTargets,
  onNextBlock,
  onFinish,
}: DeepReviewModeScreenProps) {
  return (
    <Screen style={sessionStyles.container} scrollable>
      <DeepConsolidationRunner
        blocks={blocks}
        blockIndex={blockIndex}
        remainingSeconds={remainingSeconds}
        sessionElapsedSeconds={sessionElapsedSeconds}
        verbTargets={verbTargets}
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
