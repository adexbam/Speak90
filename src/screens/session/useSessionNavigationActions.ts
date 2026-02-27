import { useCallback } from 'react';
import type { Router } from 'expo-router';
import { blurActiveElement } from '../../utils/blurActiveElement';

type UseSessionNavigationActionsParams = {
  router: Router;
  persistDraftNow: () => Promise<void>;
  lightPersistDraftOnClose: () => Promise<void>;
  deepPersistDraftOnClose: () => Promise<void>;
  milestonePersistDraftOnClose: () => Promise<void>;
  isLightReviewMode: boolean;
  isDeepConsolidationMode: boolean;
  isMilestoneMode: boolean;
};

export function useSessionNavigationActions({
  router,
  persistDraftNow,
  lightPersistDraftOnClose,
  deepPersistDraftOnClose,
  milestonePersistDraftOnClose,
  isLightReviewMode,
  isDeepConsolidationMode,
  isMilestoneMode,
}: UseSessionNavigationActionsParams) {
  const handleCloseSession = useCallback(async () => {
    blurActiveElement();
    if (isLightReviewMode) {
      await lightPersistDraftOnClose();
    } else if (isDeepConsolidationMode) {
      await deepPersistDraftOnClose();
    } else if (isMilestoneMode) {
      await milestonePersistDraftOnClose();
    } else {
      await persistDraftNow();
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  }, [
    deepPersistDraftOnClose,
    isDeepConsolidationMode,
    isLightReviewMode,
    isMilestoneMode,
    lightPersistDraftOnClose,
    milestonePersistDraftOnClose,
    persistDraftNow,
    router,
  ]);

  return { handleCloseSession };
}
