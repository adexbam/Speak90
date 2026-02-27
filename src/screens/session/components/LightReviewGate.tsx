import React from 'react';
import type { ReviewBlock } from '../../../data/review-plan-loader';
import { LightReviewModeScreen, ModeCompleteScreen, ModeLoadingScreen } from './SessionModeScreens';

type LightReviewGateProps = {
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
  lightReviewBlocks: ReviewBlock[];
  onBackHome: () => void;
};

export function LightReviewGate({ lightReview, lightReviewBlocks, onBackHome }: LightReviewGateProps) {
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
