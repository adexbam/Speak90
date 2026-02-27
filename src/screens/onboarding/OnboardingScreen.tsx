import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from '../../ui/AppText';
import { PrimaryButton } from '../../ui/PrimaryButton';
import { Screen } from '../../ui/Screen';
import { Speak90Logo } from '../../ui/Speak90Logo';
import {
  DEFAULT_LANGUAGE_PREFERENCES,
  type LanguageCode,
  isSupportedLanguagePair,
  loadLanguagePreferences,
  saveLanguagePreferences,
} from '../../data/language-preferences-store';
import { onboardingStyles } from './onboarding.styles';

const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  de: 'German',
};

export function OnboardingScreen() {
  const router = useRouter();
  const [baseLanguage, setBaseLanguage] = useState<LanguageCode>(DEFAULT_LANGUAGE_PREFERENCES.baseLanguage);
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>(DEFAULT_LANGUAGE_PREFERENCES.targetLanguage);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showBaseDropdown, setShowBaseDropdown] = useState(false);
  const [showTargetDropdown, setShowTargetDropdown] = useState(false);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      const existing = await loadLanguagePreferences();
      if (!active) {
        return;
      }
      setBaseLanguage(existing.baseLanguage);
      setTargetLanguage(existing.targetLanguage);
      setIsLoading(false);
    };
    void hydrate();

    return () => {
      active = false;
    };
  }, []);

  const isSupported = useMemo(() => isSupportedLanguagePair(baseLanguage, targetLanguage), [baseLanguage, targetLanguage]);

  const handleContinue = async () => {
    if (!isSupported || isSaving) {
      return;
    }
    setIsSaving(true);
    await saveLanguagePreferences({
      baseLanguage,
      targetLanguage,
      isOnboardingComplete: true,
    });
    router.replace('/');
  };

  if (isLoading) {
    return (
      <Screen style={onboardingStyles.container}>
        <View style={onboardingStyles.wrap}>
          <AppText variant="caption" center muted>
            Loading setup...
          </AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={onboardingStyles.container}>
      <View style={onboardingStyles.wrap}>
        <Speak90Logo />
        <AppText variant="screenTitle" center>
          Choose Your Languages
        </AppText>
        <View style={onboardingStyles.card}>
          <AppText variant="cardTitle">Base Language</AppText>
          <Pressable
            style={onboardingStyles.dropdownTrigger}
            onPress={() => {
              setShowBaseDropdown((prev) => !prev);
              setShowTargetDropdown(false);
            }}
          >
            <AppText variant="bodySecondary">{LANGUAGE_LABELS[baseLanguage]}</AppText>
          </Pressable>
          {showBaseDropdown ? (
            <View style={onboardingStyles.dropdownMenu}>
              <ScrollView nestedScrollEnabled>
                {(['en', 'de'] as LanguageCode[]).map((code) => (
                  <Pressable
                    key={`base-${code}`}
                    style={[onboardingStyles.dropdownItem, baseLanguage === code ? onboardingStyles.dropdownItemSelected : null]}
                    onPress={() => {
                      setBaseLanguage(code);
                      setShowBaseDropdown(false);
                    }}
                  >
                    <AppText variant="bodySecondary">{LANGUAGE_LABELS[code]}</AppText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}
          <AppText variant="cardTitle">Learning Language</AppText>
          <Pressable
            style={onboardingStyles.dropdownTrigger}
            onPress={() => {
              setShowTargetDropdown((prev) => !prev);
              setShowBaseDropdown(false);
            }}
          >
            <AppText variant="bodySecondary">{LANGUAGE_LABELS[targetLanguage]}</AppText>
          </Pressable>
          {showTargetDropdown ? (
            <View style={onboardingStyles.dropdownMenu}>
              <ScrollView nestedScrollEnabled>
                {(['de', 'en'] as LanguageCode[]).map((code) => (
                  <Pressable
                    key={`target-${code}`}
                    style={[onboardingStyles.dropdownItem, targetLanguage === code ? onboardingStyles.dropdownItemSelected : null]}
                    onPress={() => {
                      setTargetLanguage(code);
                      setShowTargetDropdown(false);
                    }}
                  >
                    <AppText variant="bodySecondary">{LANGUAGE_LABELS[code]}</AppText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}
          {!isSupported ? (
            <AppText variant="caption" muted>
              This language pair is not available yet. Currently supported: English to German.
            </AppText>
          ) : (
            <AppText variant="caption" muted>
              Available now: English to German. This is selected by default.
            </AppText>
          )}
          <PrimaryButton
            label={isSaving ? 'Saving...' : 'Continue'}
            onPress={() => {
              void handleContinue();
            }}
            disabled={!isSupported || isSaving}
          />
        </View>
      </View>
    </Screen>
  );
}
