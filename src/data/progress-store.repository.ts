import AsyncStorage from '@react-native-async-storage/async-storage';
import { PROGRESS_KEY } from './progress-store.constants';
import { sanitizeProgress } from './progress-store.utils';
import { DEFAULT_PROGRESS } from './progress-store.constants';
import type { UserProgress } from './progress-store.types';

export async function loadProgressRecord(): Promise<UserProgress> {
  const raw = await AsyncStorage.getItem(PROGRESS_KEY);
  if (!raw) {
    return DEFAULT_PROGRESS;
  }

  try {
    return sanitizeProgress(JSON.parse(raw));
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export async function saveProgressRecord(progress: UserProgress): Promise<void> {
  const safe = sanitizeProgress(progress);
  await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(safe));
}
