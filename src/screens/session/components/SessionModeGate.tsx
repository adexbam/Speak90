import React from 'react';
import { View } from 'react-native';
import { BannerAdSlot } from '../../../ads/BannerAdSlot';
import type { Day } from '../../../data/day-model';
import type { SrsCard } from '../../../data/srs-store';
import { AppText } from '../../../ui/AppText';
import { PrimaryButton } from '../../../ui/PrimaryButton';
import { Screen } from '../../../ui/Screen';
import { sessionStyles } from '../session.styles';
import {
  DeepReviewModeScreen,
  LightReviewModeScreen,
  MicroReviewModeScreen,
  MilestoneModeScreen,
  ModeCompleteScreen,
  ModeLoadingScreen,
} from './SessionModeScreens';
import type { DeepVerbTarget } from '../../../review/deep-consolidation';
import type { ReviewBlock } from '../../../data/review-plan-loader';
import type { RecordingMetadata } from '../../../data/recordings-store';

type SessionModeGateProps = {
  day?: Day;
  isLightReviewMode: boolean;
  isDeepConsolidationMode: boolean;
  isMilestoneMode: boolean;
  isNewDayMode: boolean;
  shouldRunMicroReview: boolean;
  onBackHome: () => void;
  lightReview: {
    hydrated: boolean;
    completed: boolean;
    saved: boolean;
    blockIndex: number;
    remainingSeconds: number;
    sessionElapsedSeconds: number;
    setCompleted: (value: boolean) => void;
    setBlockIndex: (value: number) => void;
    setRemainingSeconds: (value: number) => void;
  };
  deepReview: {
    hydrated: boolean;
    completed: boolean;
    saved: boolean;
    blockIndex: number;
    remainingSeconds: number;
    sessionElapsedSeconds: number;
    setCompleted: (value: boolean) => void;
    setBlockIndex: (value: number) => void;
    setRemainingSeconds: (value: number) => void;
  };
  milestoneReview: {
    hydrated: boolean;
    completed: boolean;
    remainingSeconds: number;
    setCompleted: (value: boolean) => void;
    records: RecordingMetadata[];
  };
  lightReviewBlocks: ReviewBlock[];
  deepBlocks: ReviewBlock[];
  deepVerbTargets: DeepVerbTarget[];
  deepDurationMinutes: number;
  microReview: {
    loading: boolean;
    cards: SrsCard[];
    memorySentences: string[];
    source: 'previous_day' | 'none';
    completed: boolean;
    onContinue: () => void;
  };
  milestoneRuntime: {
    dayNumber?: number;
    isRecording: boolean;
    hasLastRecording: boolean;
    isPlaying: boolean;
    previousPlayingUri: string | null;
    onStartRecording: () => void;
    onStopRecording: () => void;
    onPlayCurrent: () => void;
    onPlayPrevious: (uri: string) => void;
  };
};

export function SessionModeGate({
  day,
  isLightReviewMode,
  isDeepConsolidationMode,
  isMilestoneMode,
  isNewDayMode,
  shouldRunMicroReview,
  onBackHome,
  lightReview,
  deepReview,
  milestoneReview,
  lightReviewBlocks,
  deepBlocks,
  deepVerbTargets,
  deepDurationMinutes,
  microReview,
  milestoneRuntime,
}: SessionModeGateProps): React.ReactElement | null {
  if (!day) {
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

  if (isLightReviewMode) {
    if (!lightReview.hydrated) {
      return <ModeLoadingScreen label="Loading light review..." />;
    }

    if (lightReview.completed) {
      return (
        <ModeCompleteScreen
          title="Light Review Complete"
          body="You completed all 3 light review blocks."
          isSaving={!lightReview.saved}
          onBackHome={onBackHome}
        />
      );
    }

    return (
      <LightReviewModeScreen
        blocks={lightReviewBlocks}
        blockIndex={lightReview.blockIndex}
        remainingSeconds={lightReview.remainingSeconds}
        sessionElapsedSeconds={lightReview.sessionElapsedSeconds}
        onNextBlock={() => {
          const isLastBlock = lightReview.blockIndex >= lightReviewBlocks.length - 1;
          if (isLastBlock) {
            lightReview.setCompleted(true);
            return;
          }
          const nextBlockIndex = lightReview.blockIndex + 1;
          lightReview.setBlockIndex(nextBlockIndex);
          lightReview.setRemainingSeconds((lightReviewBlocks[nextBlockIndex]?.durationMinutes ?? 5) * 60);
        }}
        onFinish={() => {
          lightReview.setCompleted(true);
        }}
      />
    );
  }

  if (isDeepConsolidationMode) {
    if (!deepReview.hydrated) {
      return <ModeLoadingScreen label="Loading deep consolidation..." />;
    }

    if (deepReview.completed) {
      return (
        <ModeCompleteScreen
          title="Deep Consolidation Complete"
          body="You completed all 3 deep consolidation blocks."
          isSaving={!deepReview.saved}
          onBackHome={onBackHome}
        />
      );
    }

    return (
      <DeepReviewModeScreen
        blocks={deepBlocks}
        blockIndex={deepReview.blockIndex}
        remainingSeconds={deepReview.remainingSeconds}
        sessionElapsedSeconds={deepReview.sessionElapsedSeconds}
        verbTargets={deepVerbTargets}
        onNextBlock={() => {
          const isLastBlock = deepReview.blockIndex >= deepBlocks.length - 1;
          if (isLastBlock) {
            deepReview.setCompleted(true);
            return;
          }
          const fallbackPerBlockMinutes = Math.max(1, Math.floor(deepDurationMinutes / Math.max(1, deepBlocks.length)));
          const nextBlockIndex = deepReview.blockIndex + 1;
          deepReview.setBlockIndex(nextBlockIndex);
          deepReview.setRemainingSeconds((deepBlocks[nextBlockIndex]?.durationMinutes ?? fallbackPerBlockMinutes) * 60);
        }}
        onFinish={() => {
          deepReview.setCompleted(true);
        }}
      />
    );
  }

  if (isMilestoneMode) {
    if (!milestoneReview.hydrated) {
      return <ModeLoadingScreen label="Loading milestone audit..." />;
    }

    if (milestoneReview.completed) {
      return (
        <ModeCompleteScreen
          title="Milestone Complete"
          body="Your 10-minute milestone recording is saved."
          onBackHome={onBackHome}
        />
      );
    }

    return (
      <MilestoneModeScreen
        dayNumber={milestoneRuntime.dayNumber ?? day.dayNumber}
        remainingSeconds={milestoneReview.remainingSeconds}
        isRecording={milestoneRuntime.isRecording}
        hasLastRecording={milestoneRuntime.hasLastRecording}
        isCurrentPlaybackActive={milestoneRuntime.isPlaying}
        previousMilestones={milestoneReview.records}
        previousPlayingUri={milestoneRuntime.previousPlayingUri}
        onStartRecording={milestoneRuntime.onStartRecording}
        onStopRecording={milestoneRuntime.onStopRecording}
        onPlayCurrent={milestoneRuntime.onPlayCurrent}
        onPlayPrevious={milestoneRuntime.onPlayPrevious}
        onFinish={() => {
          milestoneReview.setCompleted(true);
        }}
      />
    );
  }

  if (isNewDayMode && shouldRunMicroReview && !microReview.completed) {
    return (
      <MicroReviewModeScreen
        isLoading={microReview.loading}
        cards={microReview.cards}
        memorySentences={microReview.memorySentences}
        source={microReview.source}
        onContinue={microReview.onContinue}
      />
    );
  }

  return null;
}

