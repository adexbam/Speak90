import { Platform } from 'react-native';

export type SttFeedbackState = 'good' | 'needs work';

export type LocalSttScoreResult =
  | {
      supported: true;
      score: number;
      feedback: SttFeedbackState;
      engine: 'local-heuristic';
    }
  | {
      supported: false;
      score: null;
      feedback: null;
      reason: string;
      engine: 'unsupported';
    };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 1;
  }
  return trimmed.split(/\s+/).length;
}

export function scorePronunciationLocally(params: {
  expectedText: string;
  durationMs: number;
  platform?: string;
}): LocalSttScoreResult {
  const platform = params.platform ?? Platform.OS;
  if (platform === 'web') {
    return {
      supported: false,
      score: null,
      feedback: null,
      reason: 'On-device scoring is not available on web.',
      engine: 'unsupported',
    };
  }

  const words = countWords(params.expectedText);
  const durationMs = Math.max(0, params.durationMs);
  const durationSec = durationMs / 1000;
  const idealSec = clamp(words * 0.9, 2, 14);

  // Heuristic shell: pace + minimum articulation time.
  const paceDeltaRatio = idealSec > 0 ? Math.abs(durationSec - idealSec) / idealSec : 1;
  const pacePenalty = clamp(paceDeltaRatio, 0, 1) * 45;
  const tooShortPenalty = durationSec < words * 0.35 ? 35 : 0;
  const tooLongPenalty = durationSec > words * 2.2 ? 15 : 0;

  const rawScore = 100 - pacePenalty - tooShortPenalty - tooLongPenalty;
  const normalizedScore = Math.round(clamp(rawScore, 0, 100));
  const feedback: SttFeedbackState = normalizedScore >= 70 ? 'good' : 'needs work';

  return {
    supported: true,
    score: normalizedScore,
    feedback,
    engine: 'local-heuristic',
  };
}

