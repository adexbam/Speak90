import { useCallback, useState } from 'react';
import { buildAnalyticsPayload, trackEvent } from '../../analytics/events';
import { scorePronunciationLocally, type SttFeedbackState } from '../stt-score';

type UseLocalPronunciationScoringParams = {
  dayNumber: number;
  sectionId: string;
  expectedText: string;
};

export function useLocalPronunciationScoring({ dayNumber, sectionId, expectedText }: UseLocalPronunciationScoringParams) {
  const [sttScore, setSttScore] = useState<number | null>(null);
  const [sttFeedback, setSttFeedback] = useState<SttFeedbackState | null>(null);
  const [sttStatusMessage, setSttStatusMessage] = useState<string | null>(null);

  const runLocalSttScoring = useCallback((durationMs: number) => {
    const sttResult = scorePronunciationLocally({
      expectedText,
      durationMs,
    });

    if (sttResult.supported) {
      setSttScore(sttResult.score);
      setSttFeedback(sttResult.feedback);
      setSttStatusMessage(null);
      trackEvent(
        'stt_scored',
        buildAnalyticsPayload(
          {
            dayNumber,
            sectionId,
          },
          {
            supported: true,
            score: sttResult.score,
            feedback: sttResult.feedback,
            engine: sttResult.engine,
          },
        ),
      );
      return;
    }

    setSttScore(null);
    setSttFeedback(null);
    setSttStatusMessage(sttResult.reason);
    trackEvent(
      'stt_scored',
      buildAnalyticsPayload(
        {
          dayNumber,
          sectionId,
        },
        {
          supported: false,
          score: null,
          feedback: null,
          engine: sttResult.engine,
          reason: sttResult.reason,
        },
      ),
    );
  }, [dayNumber, sectionId, expectedText]);

  const resetSttStatus = useCallback(() => {
    setSttScore(null);
    setSttFeedback(null);
    setSttStatusMessage(null);
  }, []);

  return {
    sttScore,
    sttFeedback,
    sttStatusMessage,
    runLocalSttScoring,
    resetSttStatus,
  };
}
