import React from 'react';
import { View } from 'react-native';
import { BannerAdSlot } from '../../../ads/BannerAdSlot';
import type { ReviewBlock } from '../../../data/review-plan-loader';
import type { RecordingMetadata } from '../../../data/recordings-store';
import type { SrsCard } from '../../../data/srs-store';
import type { DeepVerbTarget } from '../../../review/deep-consolidation';
import { AppText } from '../../../ui/AppText';
import { PrimaryButton } from '../../../ui/PrimaryButton';
import { Screen } from '../../../ui/Screen';
import { sessionStyles } from '../session.styles';
import { DeepConsolidationRunner } from './DeepConsolidationRunner';
import { LightReviewRunner } from './LightReviewRunner';
import { MicroReviewRunner } from './MicroReviewRunner';
import { MilestoneRunner } from './MilestoneRunner';

export function ModeLoadingScreen({ label }: { label: string }) {
  return (
    <Screen style={sessionStyles.container}>
      <View style={sessionStyles.completeWrap}>
        <AppText variant="caption" center muted>
          {label}
        </AppText>
      </View>
    </Screen>
  );
}

export function ModeCompleteScreen({
  title,
  body,
  isSaving,
  onBackHome,
}: {
  title: string;
  body: string;
  isSaving?: boolean;
  onBackHome: () => void;
}) {
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

export function LightReviewModeScreen({
  blocks,
  blockIndex,
  remainingSeconds,
  sessionElapsedSeconds,
  onNextBlock,
  onFinish,
}: {
  blocks: ReviewBlock[];
  blockIndex: number;
  remainingSeconds: number;
  sessionElapsedSeconds: number;
  onNextBlock: () => void;
  onFinish: () => void;
}) {
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

export function DeepReviewModeScreen({
  blocks,
  blockIndex,
  remainingSeconds,
  sessionElapsedSeconds,
  verbTargets,
  onNextBlock,
  onFinish,
}: {
  blocks: ReviewBlock[];
  blockIndex: number;
  remainingSeconds: number;
  sessionElapsedSeconds: number;
  verbTargets: DeepVerbTarget[];
  onNextBlock: () => void;
  onFinish: () => void;
}) {
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

export function MilestoneModeScreen({
  dayNumber,
  remainingSeconds,
  isRecording,
  hasLastRecording,
  isCurrentPlaybackActive,
  previousMilestones,
  previousPlayingUri,
  onStartRecording,
  onStopRecording,
  onPlayCurrent,
  onPlayPrevious,
  onFinish,
}: {
  dayNumber: number;
  remainingSeconds: number;
  isRecording: boolean;
  hasLastRecording: boolean;
  isCurrentPlaybackActive: boolean;
  previousMilestones: RecordingMetadata[];
  previousPlayingUri: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayCurrent: () => void;
  onPlayPrevious: (uri: string) => void;
  onFinish: () => void;
}) {
  return (
    <Screen style={sessionStyles.container} scrollable>
      <MilestoneRunner
        dayNumber={dayNumber}
        remainingSeconds={remainingSeconds}
        isRecording={isRecording}
        hasLastRecording={hasLastRecording}
        isCurrentPlaybackActive={isCurrentPlaybackActive}
        previousMilestones={previousMilestones}
        previousPlayingUri={previousPlayingUri}
        onStartRecording={onStartRecording}
        onStopRecording={onStopRecording}
        onPlayCurrent={onPlayCurrent}
        onPlayPrevious={onPlayPrevious}
        onFinish={onFinish}
        canFinish={remainingSeconds === 0}
      />
      <View style={sessionStyles.bannerWrap}>
        <View style={sessionStyles.bannerBox}>
          <BannerAdSlot />
        </View>
      </View>
    </Screen>
  );
}

export function MicroReviewModeScreen({
  isLoading,
  cards,
  memorySentences,
  source,
  onContinue,
}: {
  isLoading: boolean;
  cards: SrsCard[];
  memorySentences: string[];
  source: 'previous_day' | 'none';
  onContinue: () => void;
}) {
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
