import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { HomeScreen } from '@/src/screens/home/HomeScreen';
import { Screen } from '@/src/ui/Screen';
import { AppText } from '@/src/ui/AppText';
import { useAppSettingsStore } from '@/src/state/app-settings-store';

export default function Index() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const languagePreferences = useAppSettingsStore((s) => s.languagePreferences);
  const hydrateSettings = useAppSettingsStore((s) => s.hydrate);

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      const { languagePreferences } = await hydrateSettings();
      if (!active) {
        return;
      }
      if (!languagePreferences.isOnboardingComplete) {
        router.replace('/onboarding');
        return;
      }
      setIsReady(true);
    };
    void bootstrap();

    return () => {
      active = false;
    };
  }, [hydrateSettings, router]);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    if (!languagePreferences.isOnboardingComplete) {
      router.replace('/onboarding');
    }
  }, [isReady, languagePreferences.isOnboardingComplete, router]);

  if (!isReady) {
    return (
      <Screen>
        <AppText variant="caption" center muted>
          Loading...
        </AppText>
      </Screen>
    );
  }

  return <HomeScreen />;
}
