import { useEffect, useState } from 'react';
import { AdEventType, InterstitialAd, TestIds, type InterstitialAd as InterstitialAdType } from 'react-native-google-mobile-ads';

const interstitialFromEnv = process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID;
const interstitialAdUnitId = __DEV__ ? TestIds.INTERSTITIAL : interstitialFromEnv;

export function useInterstitialOnComplete() {
  const [interstitial, setInterstitial] = useState<InterstitialAdType | null>(null);
  const [interstitialLoaded, setInterstitialLoaded] = useState(false);

  useEffect(() => {
    if (!interstitialAdUnitId) {
      return;
    }

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

  return async () => {
    if (!interstitialAdUnitId || !interstitial || !interstitialLoaded) {
      return false;
    }

    return new Promise<boolean>((resolve) => {
      let settled = false;
      const settle = (result: boolean) => {
        if (settled) {
          return;
        }
        settled = true;
        unsubscribeClosed();
        unsubscribeError();
        resolve(result);
      };

      const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        settle(true);
      });

      const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, () => {
        settle(false);
      });

      interstitial.show();

      // Defensive timeout so navigation cannot get blocked by SDK event issues.
      setTimeout(() => settle(true), 2000);
    });
  };
}
