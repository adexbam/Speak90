import React from 'react';
import { View } from 'react-native';
import type { ReviewBlock } from '../../../data/review-plan-loader';
import type { DeepVerbTarget } from '../../../review/deep-consolidation';
import { AppText } from '../../../ui/AppText';
import { PrimaryButton } from '../../../ui/PrimaryButton';
import { sessionStyles } from '../session.styles';

type DeepConsolidationRunnerProps = {
  blocks: ReviewBlock[];
  blockIndex: number;
  remainingSeconds: number;
  sessionElapsedSeconds: number;
  verbTargets: DeepVerbTarget[];
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

export function DeepConsolidationRunner({
  blocks,
  blockIndex,
  remainingSeconds,
  sessionElapsedSeconds,
  verbTargets,
  onNextBlock,
  onFinish,
}: DeepConsolidationRunnerProps) {
  const block = blocks[blockIndex];
  if (!block) {
    return null;
  }

  const isLastBlock = blockIndex >= blocks.length - 1;
  return (
    <View style={sessionStyles.completeWrap}>
      <AppText variant="screenTitle" center>
        Deep Consolidation
      </AppText>
      <AppText variant="caption" center muted>
        Block {blockIndex + 1}/{blocks.length}
      </AppText>
      <View style={sessionStyles.reviewBlockCard}>
        <AppText variant="cardTitle" center>
          {block.title}
        </AppText>
        {block.instructions.map((instruction) => (
          <AppText key={instruction} variant="bodySecondary" center>
            {instruction}
          </AppText>
        ))}
        {block.id === 'verb-clusters' ? (
          <View style={sessionStyles.microReviewWrap}>
            {verbTargets.map((target) => (
              <AppText key={target.label} variant="caption" center muted>
                Days {target.label}: {target.verbs.length > 0 ? target.verbs.join(' | ') : 'No verbs available yet'}
              </AppText>
            ))}
          </View>
        ) : null}
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
      <PrimaryButton label={isLastBlock ? 'Finish Deep Consolidation' : 'Next Block'} onPress={isLastBlock ? onFinish : onNextBlock} />
    </View>
  );
}
