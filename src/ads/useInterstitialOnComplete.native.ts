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
      const MIN_AD_WAIT_MS = 5000;
      let settled = false;
      let minWaitComplete = false;
      let adResult: boolean | null = null;
      let minWaitTimeoutId: ReturnType<typeof setTimeout> | null = null;

      const settle = (result: boolean) => {
        if (settled) {
          return;
        }
        settled = true;
        if (minWaitTimeoutId) {
          clearTimeout(minWaitTimeoutId);
        }
        unsubscribeClosed();
        unsubscribeError();
        resolve(result);
      };

      const trySettle = () => {
        if (!minWaitComplete) {
          return;
        }
        if (adResult === null) {
          // If SDK doesn't send close/error, unblock after fixed minimum wait.
          settle(true);
          return;
        }
        settle(adResult);
      };

      const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        adResult = true;
        trySettle();
      });

      const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, () => {
        adResult = false;
        trySettle();
      });

      interstitial.show();

      minWaitTimeoutId = setTimeout(() => {
        minWaitComplete = true;
        trySettle();
      }, MIN_AD_WAIT_MS);
    });
  };
}
