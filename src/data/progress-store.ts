import AsyncStorage from '@react-native-async-storage/async-storage';

const PROGRESS_KEY = 'speak90:user-progress:v1';
export type ReviewMode = 'new_day' | 'light_review' | 'deep_consolidation' | 'milestone';

export interface ReviewModeCompletionCounts {
  new_day: number;
  light_review: number;
  deep_consolidation: number;
  milestone: number;
}

export interface UserProgress {
  currentDay: number;
  streak: number;
  sessionsCompleted: number[];
  totalMinutes: number;
  lastCompletedDate?: string;
  lightReviewCompletedDates?: string[];
  deepConsolidationCompletedDates?: string[];
  completedReinforcementCheckpointDays?: number[];
  offeredReinforcementCheckpointDays?: number[];
  microReviewShownDates?: string[];
  microReviewCompletedDates?: string[];
  reviewModeCompletionCounts?: ReviewModeCompletionCounts;
}

const DEFAULT_PROGRESS: UserProgress = {
  currentDay: 1,
  streak: 0,
  sessionsCompleted: [],
  totalMinutes: 0,
  reviewModeCompletionCounts: {
    new_day: 0,
    light_review: 0,
    deep_consolidation: 0,
    milestone: 0,
  },
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
  const lightReviewCompletedDates = Array.isArray(p.lightReviewCompletedDates)
    ? [...new Set(p.lightReviewCompletedDates.filter((v): v is string => typeof v === 'string' && v.length > 0))].sort()
    : [];
  const deepConsolidationCompletedDates = Array.isArray(p.deepConsolidationCompletedDates)
    ? [...new Set(p.deepConsolidationCompletedDates.filter((v): v is string => typeof v === 'string' && v.length > 0))].sort()
    : [];
  const completedReinforcementCheckpointDays = Array.isArray(p.completedReinforcementCheckpointDays)
    ? [...new Set(p.completedReinforcementCheckpointDays.filter((v): v is number => Number.isInteger(v) && v > 0))].sort((a, b) => a - b)
    : [];
  const offeredReinforcementCheckpointDays = Array.isArray(p.offeredReinforcementCheckpointDays)
    ? [...new Set(p.offeredReinforcementCheckpointDays.filter((v): v is number => Number.isInteger(v) && v > 0))].sort((a, b) => a - b)
    : [];
  const microReviewShownDates = Array.isArray(p.microReviewShownDates)
    ? [...new Set(p.microReviewShownDates.filter((v): v is string => typeof v === 'string' && v.length > 0))].sort()
    : [];
  const microReviewCompletedDates = Array.isArray(p.microReviewCompletedDates)
    ? [...new Set(p.microReviewCompletedDates.filter((v): v is string => typeof v === 'string' && v.length > 0))].sort()
    : [];
  const reviewModeCompletionCounts = p.reviewModeCompletionCounts ?? DEFAULT_PROGRESS.reviewModeCompletionCounts;

  return {
    currentDay,
    streak,
    sessionsCompleted,
    totalMinutes,
    lastCompletedDate,
    lightReviewCompletedDates,
    deepConsolidationCompletedDates,
    completedReinforcementCheckpointDays,
    offeredReinforcementCheckpointDays,
    microReviewShownDates,
    microReviewCompletedDates,
    reviewModeCompletionCounts: {
      new_day: Number.isInteger(reviewModeCompletionCounts?.new_day) && (reviewModeCompletionCounts?.new_day ?? 0) >= 0
        ? (reviewModeCompletionCounts.new_day as number)
        : 0,
      light_review: Number.isInteger(reviewModeCompletionCounts?.light_review) && (reviewModeCompletionCounts?.light_review ?? 0) >= 0
        ? (reviewModeCompletionCounts.light_review as number)
        : 0,
      deep_consolidation:
        Number.isInteger(reviewModeCompletionCounts?.deep_consolidation) && (reviewModeCompletionCounts?.deep_consolidation ?? 0) >= 0
          ? (reviewModeCompletionCounts.deep_consolidation as number)
          : 0,
      milestone: Number.isInteger(reviewModeCompletionCounts?.milestone) && (reviewModeCompletionCounts?.milestone ?? 0) >= 0
        ? (reviewModeCompletionCounts.milestone as number)
        : 0,
    },
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
  const sessionMinutes = params.sessionSeconds > 0 ? Math.max(1, Math.ceil(params.sessionSeconds / 60)) : 0;

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

export async function completeLightReviewAndSave(date = new Date()): Promise<UserProgress> {
  const progress = await loadUserProgress();
  const today = toLocalDateKey(date);
  const existing = progress.lightReviewCompletedDates ?? [];
  const nextDates = [...new Set([...existing, today])].sort();

  const updated: UserProgress = {
    ...progress,
    lightReviewCompletedDates: nextDates,
  };

  await saveUserProgress(updated);
  return updated;
}

export async function completeDeepConsolidationAndSave(date = new Date()): Promise<UserProgress> {
  const progress = await loadUserProgress();
  const today = toLocalDateKey(date);
  const existing = progress.deepConsolidationCompletedDates ?? [];
  const nextDates = [...new Set([...existing, today])].sort();

  const updated: UserProgress = {
    ...progress,
    deepConsolidationCompletedDates: nextDates,
  };

  await saveUserProgress(updated);
  return updated;
}

export async function completeReinforcementCheckpointAndSave(checkpointDay: number): Promise<UserProgress> {
  const progress = await loadUserProgress();
  if (!Number.isInteger(checkpointDay) || checkpointDay <= 0) {
    return progress;
  }

  const existing = progress.completedReinforcementCheckpointDays ?? [];
  const offered = progress.offeredReinforcementCheckpointDays ?? [];
  const nextCheckpointDays = [...new Set([...existing, checkpointDay])].sort((a, b) => a - b);
  const nextOfferedDays = [...new Set([...offered, checkpointDay])].sort((a, b) => a - b);

  const updated: UserProgress = {
    ...progress,
    completedReinforcementCheckpointDays: nextCheckpointDays,
    offeredReinforcementCheckpointDays: nextOfferedDays,
  };

  await saveUserProgress(updated);
  return updated;
}

export async function markReinforcementCheckpointOfferedAndSave(checkpointDay: number): Promise<UserProgress> {
  const progress = await loadUserProgress();
  if (!Number.isInteger(checkpointDay) || checkpointDay <= 0) {
    return progress;
  }

  const offered = progress.offeredReinforcementCheckpointDays ?? [];
  const nextOfferedDays = [...new Set([...offered, checkpointDay])].sort((a, b) => a - b);
  const updated: UserProgress = {
    ...progress,
    offeredReinforcementCheckpointDays: nextOfferedDays,
  };
  await saveUserProgress(updated);
  return updated;
}

export async function markMicroReviewShownAndSave(date = new Date()): Promise<UserProgress> {
  const progress = await loadUserProgress();
  const dateKey = toLocalDateKey(date);
  const shownDates = progress.microReviewShownDates ?? [];
  const nextShownDates = [...new Set([...shownDates, dateKey])].sort();
  const updated: UserProgress = {
    ...progress,
    microReviewShownDates: nextShownDates,
  };
  await saveUserProgress(updated);
  return updated;
}

export async function markMicroReviewCompletedAndSave(date = new Date()): Promise<UserProgress> {
  const progress = await loadUserProgress();
  const dateKey = toLocalDateKey(date);
  const completedDates = progress.microReviewCompletedDates ?? [];
  const nextCompletedDates = [...new Set([...completedDates, dateKey])].sort();
  const shownDates = progress.microReviewShownDates ?? [];
  const nextShownDates = [...new Set([...shownDates, dateKey])].sort();
  const updated: UserProgress = {
    ...progress,
    microReviewShownDates: nextShownDates,
    microReviewCompletedDates: nextCompletedDates,
  };
  await saveUserProgress(updated);
  return updated;
}

export async function incrementReviewModeCompletionAndSave(mode: ReviewMode): Promise<UserProgress> {
  const progress = await loadUserProgress();
  const current = progress.reviewModeCompletionCounts ?? DEFAULT_PROGRESS.reviewModeCompletionCounts!;
  const updated: UserProgress = {
    ...progress,
    reviewModeCompletionCounts: {
      ...current,
      [mode]: (current[mode] ?? 0) + 1,
    },
  };
  await saveUserProgress(updated);
  return updated;
}
