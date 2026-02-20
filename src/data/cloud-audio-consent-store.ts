import AsyncStorage from '@react-native-async-storage/async-storage';

const CLOUD_AUDIO_CONSENT_KEY = 'speak90:cloud-audio-consent:v1';

export type CloudAudioConsentDecision = 'granted' | 'denied';

export type CloudAudioConsentAudit = {
  decision: CloudAudioConsentDecision;
  decidedAt: string;
};

function isValidConsentAudit(value: unknown): value is CloudAudioConsentAudit {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<CloudAudioConsentAudit>;
  return (
    (candidate.decision === 'granted' || candidate.decision === 'denied') &&
    typeof candidate.decidedAt === 'string' &&
    candidate.decidedAt.length > 0
  );
}

export async function loadCloudAudioConsentAudit(): Promise<CloudAudioConsentAudit | null> {
  const raw = await AsyncStorage.getItem(CLOUD_AUDIO_CONSENT_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return isValidConsentAudit(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveCloudAudioConsentAudit(audit: CloudAudioConsentAudit): Promise<void> {
  await AsyncStorage.setItem(CLOUD_AUDIO_CONSENT_KEY, JSON.stringify(audit));
}

