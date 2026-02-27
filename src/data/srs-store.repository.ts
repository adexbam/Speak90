import AsyncStorage from '@react-native-async-storage/async-storage';
import { SRS_KEY } from './srs-store.constants';
import { sanitizeCard } from './srs-store.utils';
import type { SrsCard } from './srs-store.types';

export async function loadSrsCardRecords(): Promise<SrsCard[]> {
  const raw = await AsyncStorage.getItem(SRS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map(sanitizeCard).filter((card): card is SrsCard => card !== null);
  } catch {
    return [];
  }
}

export async function saveSrsCardRecords(cards: SrsCard[]): Promise<void> {
  await AsyncStorage.setItem(SRS_KEY, JSON.stringify(cards));
}
