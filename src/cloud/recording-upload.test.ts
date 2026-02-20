import { shouldUploadRecordingToCloud } from './recording-upload';

describe('recording-upload', () => {
  it('requires feature flag + backup enabled + consent granted', () => {
    expect(
      shouldUploadRecordingToCloud({
        cloudFlagEnabled: true,
        cloudBackupEnabled: true,
        consentDecision: 'granted',
      }),
    ).toBe(true);

    expect(
      shouldUploadRecordingToCloud({
        cloudFlagEnabled: false,
        cloudBackupEnabled: true,
        consentDecision: 'granted',
      }),
    ).toBe(false);

    expect(
      shouldUploadRecordingToCloud({
        cloudFlagEnabled: true,
        cloudBackupEnabled: false,
        consentDecision: 'granted',
      }),
    ).toBe(false);

    expect(
      shouldUploadRecordingToCloud({
        cloudFlagEnabled: true,
        cloudBackupEnabled: true,
        consentDecision: 'denied',
      }),
    ).toBe(false);
  });
});

