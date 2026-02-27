import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { HomeScreen } from '@/src/screens/home/HomeScreen';
import { loadLanguagePreferences } from '@/src/data/language-preferences-store';
import { Screen } from '@/src/ui/Screen';
import { AppText } from '@/src/ui/AppText';

export default function Index() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      const preferences = await loadLanguagePreferences();
      if (!active) {
        return;
      }
      if (!preferences.isOnboardingComplete) {
        router.replace('/onboarding');
        return;
      }
      setIsReady(true);
    };
    void bootstrap();

    return () => {
      active = false;
    };
  }, [router]);

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
