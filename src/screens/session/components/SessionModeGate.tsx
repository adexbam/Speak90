import React from 'react';
import type { Day } from '../../../data/day-model';
import type { SrsCard } from '../../../data/srs-store';
import {
  MicroReviewModeScreen,
} from './SessionModeScreens';
import type { DeepVerbTarget } from '../../../review/deep-consolidation';
import type { ReviewBlock } from '../../../data/review-plan-loader';
import type { RecordingMetadata } from '../../../data/recordings-store';
import { SessionModeMissingDay } from './SessionModeMissingDay';
import { LightReviewGate } from './LightReviewGate';
import { DeepReviewGate } from './DeepReviewGate';
import { MilestoneModeGate } from './MilestoneModeGate';

export type SessionModeGateProps = {
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
    return <SessionModeMissingDay onBackHome={onBackHome} />;
  }

  if (isLightReviewMode) {
    return (
      <LightReviewGate
        lightReview={lightReview}
        lightReviewBlocks={lightReviewBlocks}
        onBackHome={onBackHome}
      />
    );
  }

  if (isDeepConsolidationMode) {
    return (
      <DeepReviewGate
        deepReview={deepReview}
        deepBlocks={deepBlocks}
        deepVerbTargets={deepVerbTargets}
        deepDurationMinutes={deepDurationMinutes}
        onBackHome={onBackHome}
      />
    );
  }

  if (isMilestoneMode) {
    return (
      <MilestoneModeGate
        day={day}
        milestoneReview={milestoneReview}
        milestoneRuntime={milestoneRuntime}
        onBackHome={onBackHome}
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
