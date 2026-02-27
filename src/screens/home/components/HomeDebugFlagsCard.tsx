import React from 'react';
import { View } from 'react-native';
import { CLOUD_BACKUP_RETENTION_DAYS } from '../../../cloud/cloud-backup-config';
import { AppText } from '../../../ui/AppText';
import { PrimaryButton } from '../../../ui/PrimaryButton';
import { homeStyles } from '../home.styles';
import type { FeatureFlags } from './home-section.types';

type HomeDebugFlagsCardProps = {
  flags: FeatureFlags;
  lastUpdatedAt: string | number | null;
  isFlagsLoading: boolean;
  flagsErrorMessage: string | null;
  cloudBackupEnabled: boolean;
  cloudBackupFeedback: string | null;
  onRefreshFlags: () => void;
  onToggleCloudBackup: () => void;
};

export function HomeDebugFlagsCard({
  flags,
  lastUpdatedAt,
  isFlagsLoading,
  flagsErrorMessage,
  cloudBackupEnabled,
  cloudBackupFeedback,
  onRefreshFlags,
  onToggleCloudBackup,
}: HomeDebugFlagsCardProps) {
  return (
    <View style={homeStyles.reminderCard}>
      <AppText variant="cardTitle">QA Debug: Feature Flags</AppText>
      <AppText variant="caption" muted>
        v3_stt_on_device: {String(flags.v3_stt_on_device)}
      </AppText>
      <AppText variant="caption" muted>
        v3_stt_cloud_opt_in: {String(flags.v3_stt_cloud_opt_in)}
      </AppText>
      <AppText variant="caption" muted>
        v3_cloud_backup: {String(flags.v3_cloud_backup)}
      </AppText>
      <AppText variant="caption" muted>
        v3_premium_iap: {String(flags.v3_premium_iap)}
      </AppText>
      <AppText variant="caption" muted>
        Last refresh: {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString() : 'never'}
      </AppText>
      <PrimaryButton label={isFlagsLoading ? 'Refreshing...' : 'Refresh Flags'} onPress={onRefreshFlags} disabled={isFlagsLoading} />
      {flagsErrorMessage ? (
        <AppText variant="caption" muted>
          {flagsErrorMessage}
        </AppText>
      ) : null}
      {flags.v3_cloud_backup ? (
        <>
          <PrimaryButton
            label={cloudBackupEnabled ? 'Disable Cloud Backup' : 'Enable Cloud Backup'}
            onPress={onToggleCloudBackup}
          />
          <AppText variant="caption" muted>
            Retention: {CLOUD_BACKUP_RETENTION_DAYS} days
          </AppText>
          {cloudBackupFeedback ? (
            <AppText variant="caption" muted>
              {cloudBackupFeedback}
            </AppText>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
