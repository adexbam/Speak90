import { useCallback, useEffect, useRef, useState } from 'react';
import {
  loadCloudAudioConsentAudit,
  saveCloudAudioConsentAudit,
  type CloudAudioConsentAudit,
} from '../data/cloud-audio-consent-store';

export function useCloudAudioConsent() {
  const [audit, setAudit] = useState<CloudAudioConsentAudit | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const pendingResolverRef = useRef<((value: boolean) => void) | null>(null);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      const existing = await loadCloudAudioConsentAudit();
      if (!active) {
        return;
      }
      setAudit(existing);
      setIsHydrated(true);
    };
    void hydrate();
    return () => {
      active = false;
    };
  }, []);

  const requestCloudConsent = useCallback(async (): Promise<boolean> => {
    if (audit?.decision === 'granted') {
      return true;
    }
    if (audit?.decision === 'denied') {
      return false;
    }
    return new Promise<boolean>((resolve) => {
      pendingResolverRef.current = resolve;
      setIsModalVisible(true);
    });
  }, [audit]);

  const settleConsent = useCallback(async (decision: 'granted' | 'denied') => {
    const next: CloudAudioConsentAudit = {
      decision,
      decidedAt: new Date().toISOString(),
    };
    await saveCloudAudioConsentAudit(next);
    setAudit(next);
    setIsModalVisible(false);

    if (pendingResolverRef.current) {
      pendingResolverRef.current(decision === 'granted');
      pendingResolverRef.current = null;
    }
  }, []);

  const approveCloudConsent = useCallback(async () => {
    await settleConsent('granted');
  }, [settleConsent]);

  const denyCloudConsent = useCallback(async () => {
    await settleConsent('denied');
  }, [settleConsent]);

  const dismissConsentModal = useCallback(() => {
    setIsModalVisible(false);
    if (pendingResolverRef.current) {
      pendingResolverRef.current(false);
      pendingResolverRef.current = null;
    }
  }, []);

  return {
    audit,
    isHydrated,
    isModalVisible,
    requestCloudConsent,
    approveCloudConsent,
    denyCloudConsent,
    dismissConsentModal,
  };
}

