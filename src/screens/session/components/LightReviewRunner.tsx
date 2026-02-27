import React from 'react';
import { View } from 'react-native';
import type { ReviewBlock } from '../../../data/review-plan-loader';
import { AppText } from '../../../ui/AppText';
import { sessionStyles } from '../session.styles';
import { ReviewRunnerScaffold } from './ReviewRunnerScaffold';

type LightReviewRunnerProps = {
  blocks: ReviewBlock[];
  blockIndex: number;
  remainingSeconds: number;
  sessionElapsedSeconds: number;
  onNextBlock: () => void;
  onFinish: () => void;
};

function formatSeconds(totalSeconds: number): string {
  const safe = Math.max(totalSeconds, 0);
  const minutes = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (safe % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function LightReviewRunner({
  blocks,
  blockIndex,
  remainingSeconds,
  sessionElapsedSeconds,
  onNextBlock,
  onFinish,
}: LightReviewRunnerProps) {
  const block = blocks[blockIndex];
  if (!block) {
    return null;
  }

  const isLastBlock = blockIndex >= blocks.length - 1;
  return (
    <ReviewRunnerScaffold
      title="Light Review"
      subtitle={`Block ${blockIndex + 1}/${blocks.length}`}
      primaryAction={{
        label: isLastBlock ? 'Finish Light Review' : 'Next Block',
        onPress: isLastBlock ? onFinish : onNextBlock,
      }}
    >
      <View style={sessionStyles.reviewBlockCard}>
        <AppText variant="cardTitle" center>
          {block.title}
        </AppText>
        {block.instructions.map((instruction) => (
          <AppText key={instruction} variant="bodySecondary" center>
            {instruction}
          </AppText>
        ))}
      </View>
      <AppText variant="timer" center>
        {formatSeconds(remainingSeconds)}
      </AppText>
      <AppText variant="caption" center muted>
        Remaining in block
      </AppText>
      <AppText variant="caption" center muted>
        Elapsed: {formatSeconds(sessionElapsedSeconds)}
      </AppText>
    </ReviewRunnerScaffold>
  );
}
