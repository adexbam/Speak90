import React from 'react';
import type { ReviewBlock } from '../../../data/review-plan-loader';
import type { DeepVerbTarget } from '../../../review/deep-consolidation';
import { DeepReviewModeScreen, ModeCompleteScreen, ModeLoadingScreen } from './SessionModeScreens';

type DeepReviewGateProps = {
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
  deepBlocks: ReviewBlock[];
  deepVerbTargets: DeepVerbTarget[];
  deepDurationMinutes: number;
  onBackHome: () => void;
};

export function DeepReviewGate({
  deepReview,
  deepBlocks,
  deepVerbTargets,
  deepDurationMinutes,
  onBackHome,
}: DeepReviewGateProps) {
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
