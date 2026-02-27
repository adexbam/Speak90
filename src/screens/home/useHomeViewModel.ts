import { useHomeNavigationModel } from './useHomeNavigationModel';
import { useHomePlanModel } from './useHomePlanModel';
import { useHomeSettingsModel } from './useHomeSettingsModel';

export function useHomeViewModel() {
  const plan = useHomePlanModel();
  const settings = useHomeSettingsModel({ currentDay: plan.currentDay });
  const navigation = useHomeNavigationModel({
    currentDay: plan.currentDay,
    dailyModeResolution: plan.dailyModeResolution,
    startOver: plan.startOver,
  });

  return {
    currentDay: plan.currentDay,
    dailyModeResolution: plan.dailyModeResolution,
    progress: plan.progress,
    streak: plan.streak,
    averageMinutes: plan.averageMinutes,
    todayModeLabel: plan.todayModeLabel,
    todayPlan: plan.todayPlan,
    canResumeTodayPlan: plan.canResumeTodayPlan,
    sessionController: navigation.sessionController,
    reminderController: settings.reminderController,
    reminderGate: settings.reminderGate,
    flags: settings.flags,
    isFlagsLoading: settings.isFlagsLoading,
    lastUpdatedAt: settings.lastUpdatedAt,
    flagsErrorMessage: settings.flagsErrorMessage,
    refreshFlags: settings.refreshFlags,
    goToOnboarding: navigation.goToOnboarding,
    goToStats: navigation.goToStats,
  };
}
