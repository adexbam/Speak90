import AsyncStorage from '@react-native-async-storage/async-storage';

const PROGRESS_KEY = 'speak90:user-progress:v1';

export interface UserProgress {
  currentDay: number;
  streak: number;
  sessionsCompleted: number[];
  totalMinutes: number;
  lastCompletedDate?: string;
}

const DEFAULT_PROGRESS: UserProgress = {
  currentDay: 1,
  streak: 0,
  sessionsCompleted: [],
  totalMinutes: 0,
};

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function yesterdayKey(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return toLocalDateKey(d);
}

function sanitizeProgress(input: unknown): UserProgress {
  if (typeof input !== 'object' || input === null) {
    return DEFAULT_PROGRESS;
  }

  const p = input as Partial<UserProgress>;

  const currentDay = Number.isInteger(p.currentDay) && (p.currentDay ?? 0) > 0 ? (p.currentDay as number) : 1;
  const streak = Number.isInteger(p.streak) && (p.streak ?? -1) >= 0 ? (p.streak as number) : 0;
  const sessionsCompleted = Array.isArray(p.sessionsCompleted)
    ? [...new Set(p.sessionsCompleted.filter((v): v is number => Number.isInteger(v) && v > 0))].sort((a, b) => a - b)
    : [];
  const totalMinutes = Number.isFinite(p.totalMinutes) && (p.totalMinutes ?? -1) >= 0 ? Number(p.totalMinutes) : 0;
  const lastCompletedDate = typeof p.lastCompletedDate === 'string' ? p.lastCompletedDate : undefined;

  return {
    currentDay,
    streak,
    sessionsCompleted,
    totalMinutes,
    lastCompletedDate,
  };
}

export async function loadUserProgress(): Promise<UserProgress> {
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

export async function saveUserProgress(progress: UserProgress): Promise<void> {
  const safe = sanitizeProgress(progress);
  await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(safe));
}

/**
 * Streak + progression rules:
 * - Completing multiple sessions on the same local day does not increase streak twice.
 * - If previous completion date was yesterday, streak increments by 1.
 * - Otherwise, streak resets to 1.
 * - `currentDay` advances only when the completed session matches `currentDay`.
 */
export async function completeSessionAndSave(params: {
  completedDay: number;
  sessionSeconds: number;
  totalDays: number;
}): Promise<UserProgress> {
  const now = new Date();
  const today = toLocalDateKey(now);
  const yesterday = yesterdayKey(now);

  const progress = await loadUserProgress();
  const sessionMinutes = Math.max(0, Math.round(params.sessionSeconds / 60));

  let streak = progress.streak;
  if (progress.lastCompletedDate !== today) {
    streak = progress.lastCompletedDate === yesterday ? progress.streak + 1 : 1;
  }

  const sessionsCompleted = [...new Set([...progress.sessionsCompleted, params.completedDay])].sort((a, b) => a - b);

  const shouldAdvanceDay = progress.currentDay === params.completedDay;
  const currentDay = shouldAdvanceDay
    ? Math.min(params.totalDays, progress.currentDay + 1)
    : Math.min(params.totalDays, progress.currentDay);

  const updated: UserProgress = {
    currentDay,
    streak,
    sessionsCompleted,
    totalMinutes: progress.totalMinutes + sessionMinutes,
    lastCompletedDate: today,
  };

  await saveUserProgress(updated);
  return updated;
}
