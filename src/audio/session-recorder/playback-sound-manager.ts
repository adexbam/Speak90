import { Audio, type AVPlaybackStatus } from 'expo-av';
import type { MutableRefObject } from 'react';

export type PlaybackSoundRefs = {
  soundRef: MutableRefObject<Audio.Sound | null>;
  loadedSoundUriRef: MutableRefObject<string | null>;
};

export async function unloadPlaybackSound(refs: PlaybackSoundRefs): Promise<void> {
  if (refs.soundRef.current) {
    await refs.soundRef.current.unloadAsync();
    refs.soundRef.current = null;
  }
  refs.loadedSoundUriRef.current = null;
}

export async function ensurePlaybackSound(params: {
  refs: PlaybackSoundRefs;
  uri: string;
  onStatus: (status: AVPlaybackStatus) => void;
}): Promise<Audio.Sound | null> {
  if (!params.refs.soundRef.current || params.refs.loadedSoundUriRef.current !== params.uri) {
    await unloadPlaybackSound(params.refs);
    const { sound } = await Audio.Sound.createAsync(
      { uri: params.uri },
      { shouldPlay: false },
      params.onStatus,
    );
    params.refs.soundRef.current = sound;
    params.refs.loadedSoundUriRef.current = params.uri;
  }

  return params.refs.soundRef.current;
}
