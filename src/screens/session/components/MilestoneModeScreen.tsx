import React from 'react';
import { View } from 'react-native';
import { BannerAdSlot } from '../../../ads/BannerAdSlot';
import type { RecordingMetadata } from '../../../data/recordings-store';
import { Screen } from '../../../ui/Screen';
import { sessionStyles } from '../session.styles';
import { MilestoneRunner } from './MilestoneRunner';

type MilestoneModeScreenProps = {
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
};

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
}: MilestoneModeScreenProps) {
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
