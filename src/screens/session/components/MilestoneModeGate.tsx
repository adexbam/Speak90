import React from 'react';
import type { Day } from '../../../data/day-model';
import type { RecordingMetadata } from '../../../data/recordings-store';
import { MilestoneModeScreen, ModeCompleteScreen, ModeLoadingScreen } from './SessionModeScreens';

type MilestoneModeGateProps = {
  day: Day;
  milestoneReview: {
    hydrated: boolean;
    completed: boolean;
    remainingSeconds: number;
    setCompleted: (value: boolean) => void;
    records: RecordingMetadata[];
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
  onBackHome: () => void;
};

export function MilestoneModeGate({ day, milestoneReview, milestoneRuntime, onBackHome }: MilestoneModeGateProps) {
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
