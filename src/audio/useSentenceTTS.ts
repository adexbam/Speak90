import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';

type SpeakOptions = {
  language?: string;
  rate?: number;
  pitch?: number;
};

export function useSentenceTTS(defaultOptions: SpeakOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      void Speech.stop();
    };
  }, []);

  const stop = useCallback(async () => {
    await Speech.stop();
    if (mountedRef.current) {
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback(
    async (text: string, options: SpeakOptions = {}) => {
      const phrase = text.trim();
      if (!phrase) {
        return;
      }

      await Speech.stop();
      if (mountedRef.current) {
        setIsSpeaking(true);
      }

      Speech.speak(phrase, {
        language: options.language ?? defaultOptions.language ?? 'de-DE',
        rate: options.rate ?? defaultOptions.rate ?? 0.92,
        pitch: options.pitch ?? defaultOptions.pitch ?? 1,
        onDone: () => {
          if (mountedRef.current) {
            setIsSpeaking(false);
          }
        },
        onStopped: () => {
          if (mountedRef.current) {
            setIsSpeaking(false);
          }
        },
        onError: () => {
          if (mountedRef.current) {
            setIsSpeaking(false);
          }
        },
      });
    },
    [defaultOptions.language, defaultOptions.pitch, defaultOptions.rate],
  );

  return { isSpeaking, speak, stop };
}
