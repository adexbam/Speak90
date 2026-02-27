import { Audio } from 'expo-av';
import { useCallback } from 'react';

type UseSessionPlaybackActionsParams = {
  previousSound: Audio.Sound | null;
  setPreviousSound: (sound: Audio.Sound | null) => void;
  previousPlayingUri: string | null;
  setPreviousPlayingUri: (value: string | null) => void;
  setCloudStatusMessage: (value: string | null) => void;
  hasLastRecording: boolean;
  requestCloudConsent: () => Promise<boolean>;
};

export function useSessionPlaybackActions({
  previousSound,
  setPreviousSound,
  previousPlayingUri,
  setPreviousPlayingUri,
  setCloudStatusMessage,
  hasLastRecording,
  requestCloudConsent,
}: UseSessionPlaybackActionsParams) {
  const handleRunCloudScore = useCallback(async () => {
    setCloudStatusMessage(null);
    if (!hasLastRecording) {
      setCloudStatusMessage('Record audio first to use cloud scoring.');
      return;
    }
    const granted = await requestCloudConsent();
    if (!granted) {
      setCloudStatusMessage('Cloud consent denied. You can keep using local-only mode.');
      return;
    }
    setCloudStatusMessage('Cloud scoring is not configured yet. Local-only mode is still active.');
  }, [hasLastRecording, requestCloudConsent, setCloudStatusMessage]);

  const handlePlayPreviousMilestone = useCallback(async (uri: string) => {
    try {
      if (!uri) {
        return;
      }

      if (previousSound) {
        const status = await previousSound.getStatusAsync();
        if (status.isLoaded && previousPlayingUri === uri && status.isPlaying) {
          await previousSound.pauseAsync();
          setPreviousPlayingUri(null);
          return;
        }
        await previousSound.unloadAsync();
        setPreviousSound(null);
      }

      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      setPreviousSound(sound);
      setPreviousPlayingUri(uri);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) {
          return;
        }
        if (status.didJustFinish) {
          setPreviousPlayingUri(null);
        }
      });
    } catch {
      setPreviousPlayingUri(null);
    }
  }, [previousPlayingUri, previousSound, setPreviousPlayingUri, setPreviousSound]);

  return {
    handleRunCloudScore,
    handlePlayPreviousMilestone,
  };
}
