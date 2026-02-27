import { useCallback } from 'react';
import { addRecordingMetadata } from '../../data/recordings-store';
import { buildAnalyticsPayload, trackEvent } from '../../analytics/events';
import { useAppSettingsStore } from '../../state/app-settings-store';
import { useCloudRecordingUpload } from './useCloudRecordingUpload';
import { useLocalPronunciationScoring } from './useLocalPronunciationScoring';

type UseRecordingPostProcessingParams = {
  dayNumber: number;
  sectionId: string;
  expectedText: string;
  cloudBackupFlagEnabled: boolean;
  recordingKind: 'session' | 'milestone';
};

type ProcessRecordingParams = {
  destinationUri: string;
  durationMs: number;
  safeSection: string;
};

export function useRecordingPostProcessing({
  dayNumber,
  sectionId,
  expectedText,
  cloudBackupFlagEnabled,
  recordingKind,
}: UseRecordingPostProcessingParams) {
  const refreshCloudBackupSettings = useAppSettingsStore((s) => s.refreshCloudBackupSettings);
  const cloudUpload = useCloudRecordingUpload({
    dayNumber,
    sectionId,
    cloudBackupFlagEnabled,
    refreshCloudBackupSettings,
  });
  const stt = useLocalPronunciationScoring({
    dayNumber,
    sectionId,
    expectedText,
  });
  const { runCloudUpload, resetCloudUploadStatus, cloudUploadStatusMessage } = cloudUpload;
  const { runLocalSttScoring, resetSttStatus, sttScore, sttFeedback, sttStatusMessage } = stt;

  const processRecording = useCallback(async ({ destinationUri, durationMs, safeSection }: ProcessRecordingParams) => {
    await addRecordingMetadata({
      id: `${dayNumber}-${safeSection}-${Date.now()}`,
      dayNumber,
      sectionId,
      createdAt: new Date().toISOString(),
      fileUri: destinationUri,
      durationMs,
      kind: recordingKind,
    });

    trackEvent(
      'record_stop',
      buildAnalyticsPayload(
        {
          dayNumber,
          sectionId,
        },
        {
          durationMs,
          hasRecording: true,
        },
      ),
    );

    await runCloudUpload({ destinationUri, durationMs, safeSection });
    runLocalSttScoring(durationMs);
  }, [dayNumber, recordingKind, runCloudUpload, runLocalSttScoring, sectionId]);

  const reset = useCallback(() => {
    resetSttStatus();
    resetCloudUploadStatus();
  }, [resetCloudUploadStatus, resetSttStatus]);

  return {
    sttScore,
    sttFeedback,
    sttStatusMessage,
    cloudUploadStatusMessage,
    processRecording,
    reset,
  };
}
