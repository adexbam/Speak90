import Constants from 'expo-constants';

export type AnalyticsEventName =
  | 'record_start'
  | 'record_stop'
  | 'playback_start'
  | 'playback_stop'
  | 'card_reviewed'
  | 'notification_opt_in';

export type AnalyticsCoreDimensions = {
  dayNumber: number;
  sectionId: string;
  appVersion: string;
};

export type AnalyticsEventPayload = AnalyticsCoreDimensions & Record<string, string | number | boolean | null | undefined>;

function getAppVersion(): string {
  return Constants.expoConfig?.version ?? Constants.manifest2?.extra?.expoClient?.version ?? 'unknown';
}

export function buildAnalyticsPayload(
  dimensions: Omit<AnalyticsCoreDimensions, 'appVersion'>,
  extras?: Record<string, string | number | boolean | null | undefined>,
): AnalyticsEventPayload {
  return {
    dayNumber: dimensions.dayNumber,
    sectionId: dimensions.sectionId,
    appVersion: getAppVersion(),
    ...(extras ?? {}),
  };
}

export function trackEvent(eventName: AnalyticsEventName, payload: AnalyticsEventPayload): void {
  // Placeholder transport: emit structured logs for QA/event verification.
  // Avoid sending raw audio data/transcripts by construction in call sites.
  console.info('[analytics]', eventName, payload);
}
