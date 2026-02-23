import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_DRAFT_KEY = 'speak90:session-draft:v1';

export interface SessionDraft {
  dayNumber: number;
  mode?: 'new_day' | 'light_review' | 'deep_consolidation' | 'milestone';
  sectionIndex: number;
  sentenceIndex: number;
  repRound?: number;
  remainingSeconds: number;
  sessionElapsedSeconds: number;
  savedAt: string;
}

function sanitizeDraft(input: unknown): SessionDraft | null {
  if (typeof input !== 'object' || input === null) {
    return null;
  }

  const d = input as Partial<SessionDraft>;

  if (!Number.isInteger(d.dayNumber) || (d.dayNumber ?? 0) <= 0) {
    return null;
  }

  if (
    d.mode !== undefined &&
    d.mode !== 'new_day' &&
    d.mode !== 'light_review' &&
    d.mode !== 'deep_consolidation' &&
    d.mode !== 'milestone'
  ) {
    return null;
  }

  if (!Number.isInteger(d.sectionIndex) || (d.sectionIndex ?? -1) < 0) {
    return null;
  }

  if (!Number.isInteger(d.sentenceIndex) || (d.sentenceIndex ?? -1) < 0) {
    return null;
  }

  if (d.repRound !== undefined && (!Number.isInteger(d.repRound) || d.repRound < 1)) {
    return null;
  }

  if (!Number.isInteger(d.remainingSeconds) || (d.remainingSeconds ?? -1) < 0) {
    return null;
  }

  if (!Number.isInteger(d.sessionElapsedSeconds) || (d.sessionElapsedSeconds ?? -1) < 0) {
    return null;
  }

  const dayNumber = d.dayNumber as number;
  const sectionIndex = d.sectionIndex as number;
  const sentenceIndex = d.sentenceIndex as number;
  const repRound = d.repRound as number | undefined;
  const remainingSeconds = d.remainingSeconds as number;
  const sessionElapsedSeconds = d.sessionElapsedSeconds as number;

  return {
    dayNumber,
    mode: d.mode,
    sectionIndex,
    sentenceIndex,
    repRound,
    remainingSeconds,
    sessionElapsedSeconds,
    savedAt: typeof d.savedAt === 'string' ? d.savedAt : new Date().toISOString(),
  };
}

export async function loadSessionDraft(): Promise<SessionDraft | null> {
  const raw = await AsyncStorage.getItem(SESSION_DRAFT_KEY);
  if (!raw) {
    return null;
  }

  try {
    return sanitizeDraft(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function saveSessionDraft(draft: SessionDraft): Promise<void> {
  await AsyncStorage.setItem(SESSION_DRAFT_KEY, JSON.stringify(draft));
}

export async function clearSessionDraft(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_DRAFT_KEY);
}
