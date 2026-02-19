import { useEffect, useState } from 'react';
import { AdEventType, InterstitialAd, TestIds, type InterstitialAd as InterstitialAdType } from 'react-native-google-mobile-ads';

const interstitialFromEnv = process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID;
const interstitialAdUnitId = __DEV__ ? TestIds.INTERSTITIAL : (interstitialFromEnv ?? TestIds.INTERSTITIAL);

export function useInterstitialOnComplete(isComplete: boolean): void {
  const [interstitial, setInterstitial] = useState<InterstitialAdType | null>(null);
  const [interstitialLoaded, setInterstitialLoaded] = useState(false);
  const [interstitialShown, setInterstitialShown] = useState(false);

  useEffect(() => {
    const ad = InterstitialAd.createForAdRequest(interstitialAdUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });
    setInterstitial(ad);

    const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      setInterstitialLoaded(true);
    });

    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setInterstitialLoaded(false);
      ad.load();
    });

    const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, () => {
      setInterstitialLoaded(false);
    });

    ad.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, []);

  useEffect(() => {
    if (!isComplete || interstitialShown || !interstitial || !interstitialLoaded) {
      return;
    }

    interstitial.show();
    setInterstitialShown(true);
  }, [isComplete, interstitialShown, interstitial, interstitialLoaded]);
}
