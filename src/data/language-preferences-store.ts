import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_PREFERENCES_KEY = 'speak90:language-preferences:v1';

export type LanguageCode = 'en' | 'de';

export type LanguagePreferences = {
  baseLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  isOnboardingComplete: boolean;
};

export const DEFAULT_LANGUAGE_PREFERENCES: LanguagePreferences = {
  baseLanguage: 'en',
  targetLanguage: 'de',
  isOnboardingComplete: false,
};

export const SUPPORTED_LANGUAGE_PAIRS: Array<{ baseLanguage: LanguageCode; targetLanguage: LanguageCode }> = [
  {
    baseLanguage: 'en',
    targetLanguage: 'de',
  },
];

function isLanguageCode(value: unknown): value is LanguageCode {
  return value === 'en' || value === 'de';
}

function sanitizeLanguagePreferences(input: unknown): LanguagePreferences {
  if (typeof input !== 'object' || input === null) {
    return DEFAULT_LANGUAGE_PREFERENCES;
  }

  const value = input as Partial<LanguagePreferences>;
  const baseLanguage = isLanguageCode(value.baseLanguage) ? value.baseLanguage : DEFAULT_LANGUAGE_PREFERENCES.baseLanguage;
  const targetLanguage = isLanguageCode(value.targetLanguage) ? value.targetLanguage : DEFAULT_LANGUAGE_PREFERENCES.targetLanguage;

  return {
    baseLanguage,
    targetLanguage,
    isOnboardingComplete: value.isOnboardingComplete === true,
  };
}

export function isSupportedLanguagePair(baseLanguage: LanguageCode, targetLanguage: LanguageCode): boolean {
  return SUPPORTED_LANGUAGE_PAIRS.some((pair) => pair.baseLanguage === baseLanguage && pair.targetLanguage === targetLanguage);
}

export async function loadLanguagePreferences(): Promise<LanguagePreferences> {
  const raw = await AsyncStorage.getItem(LANGUAGE_PREFERENCES_KEY);
  if (!raw) {
    return DEFAULT_LANGUAGE_PREFERENCES;
  }
  try {
    return sanitizeLanguagePreferences(JSON.parse(raw));
  } catch {
    return DEFAULT_LANGUAGE_PREFERENCES;
  }
}

export async function saveLanguagePreferences(preferences: LanguagePreferences): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_PREFERENCES_KEY, JSON.stringify(sanitizeLanguagePreferences(preferences)));
}

