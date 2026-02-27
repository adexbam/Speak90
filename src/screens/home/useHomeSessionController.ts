import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import type { Router } from 'expo-router';
import { clearAllRecordings } from '../../data/recordings-store';
import { blurActiveElement } from '../../utils/blurActiveElement';
import type { DailyModeResolution } from '../../review/daily-mode-resolver';

type UseHomeSessionControllerParams = {
  router: Router;
  currentDay: number;
  dailyModeResolution: DailyModeResolution | null;
  startOver: () => Promise<void>;
};

export function useHomeSessionController({
  router,
  currentDay,
  dailyModeResolution,
  startOver,
}: UseHomeSessionControllerParams) {
  const [showPracticeDayDropdown, setShowPracticeDayDropdown] = useState(false);
  const [selectedPracticeDay, setSelectedPracticeDay] = useState<number | null>(null);
  const [clearFeedback, setClearFeedback] = useState<string | null>(null);

  const goToSession = () => {
    blurActiveElement();
    router.push({
      pathname: '/session',
      params: {
        day: String(currentDay),
        mode: dailyModeResolution?.mode ?? 'new_day',
        reinforcementReviewDay: dailyModeResolution?.reinforcementReviewDay
          ? String(dailyModeResolution.reinforcementReviewDay)
          : undefined,
        reinforcementCheckpointDay: dailyModeResolution?.reinforcementCheckpointDay
          ? String(dailyModeResolution.reinforcementCheckpointDay)
          : undefined,
      },
    });
  };

  const goToPracticeSession = (practiceDay: number) => {
    blurActiveElement();
    router.push({
      pathname: '/session',
      params: {
        day: String(practiceDay),
        mode: 'new_day',
        practice: '1',
      },
    });
  };

  const confirmStartOver = () => {
    const proceed = async () => {
      await startOver();
      goToSession();
    };

    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm('Start over and lose your current session progress?') : false;
      if (ok) {
        void proceed();
      }
      return;
    }

    Alert.alert('Start Over?', 'You will lose your current in-progress session.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start Over',
        style: 'destructive',
        onPress: () => {
          void proceed();
        },
      },
    ]);
  };

  const confirmClearRecordings = () => {
    const proceed = async () => {
      await clearAllRecordings();
      setClearFeedback('Recordings cleared.');
    };

    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm('Clear all local recordings from this device?') : false;
      if (ok) {
        void proceed();
      }
      return;
    }

    Alert.alert('Clear recordings?', 'This will delete all local recordings on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          void proceed();
        },
      },
    ]);
  };

  const practiceDayOptions = useMemo(
    () => Array.from({ length: Math.max(0, currentDay - 1) }, (_, index) => index + 1),
    [currentDay],
  );

  useEffect(() => {
    if (!clearFeedback) {
      return;
    }
    const timer = setTimeout(() => {
      setClearFeedback(null);
    }, 2500);
    return () => clearTimeout(timer);
  }, [clearFeedback]);

  return {
    showPracticeDayDropdown,
    setShowPracticeDayDropdown,
    selectedPracticeDay,
    setSelectedPracticeDay,
    clearFeedback,
    goToSession,
    goToPracticeSession,
    confirmStartOver,
    confirmClearRecordings,
    practiceDayOptions,
  };
}

