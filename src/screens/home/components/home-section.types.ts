export type ReminderPreset = {
  hour: number;
  minute: number;
  label: string;
};

export type ReminderOption = {
  label: string;
  hour: number;
  minute: number;
};

export type FeatureFlags = {
  v3_stt_on_device: boolean;
  v3_stt_cloud_opt_in: boolean;
  v3_cloud_backup: boolean;
  v3_premium_iap: boolean;
};
