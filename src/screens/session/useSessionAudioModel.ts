import { useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { useSessionRecorder } from '../../audio/useSessionRecorder';
import { useInterstitialOnComplete } from '../../ads/useInterstitialOnComplete';
import type { useSessionRuntimeModel } from './useSessionRuntimeModel';

type SessionRuntime = ReturnType<typeof useSessionRuntimeModel>;

export function useSessionAudioModel(runtime: SessionRuntime) {
  const [cloudStatusMessage, setCloudStatusMessage] = useState<string | null>(null);
  const [previousPlayingUri, setPreviousPlayingUri] = useState<string | null>(null);
  const previousSoundRef = useRef<Audio.Sound | null>(null);
  const showInterstitialIfReady = useInterstitialOnComplete();

  const recorder = useSessionRecorder({
    dayNumber: runtime.route.day?.dayNumber ?? 1,
    sectionId: runtime.route.isMilestoneMode ? 'milestone-audit' : runtime.section?.id ?? 'section',
    expectedText: runtime.speechText,
    cloudBackupFlagEnabled: runtime.flags.v3_cloud_backup,
    recordingKind: runtime.route.isMilestoneMode ? 'milestone' : 'session',
  });

  return {
    recorder,
    previousSoundRef,
    previousPlayingUri,
    setPreviousPlayingUri,
    cloudStatusMessage,
    setCloudStatusMessage,
    showInterstitialIfReady,
  };
}
