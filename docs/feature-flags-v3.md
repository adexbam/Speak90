# V3 Feature Flags (Ticket 26)

Remote config URL is read from `EXPO_PUBLIC_REMOTE_CONFIG_URL`.

Expected JSON shape:

```json
{
  "v3_stt_on_device": false,
  "v3_stt_cloud_opt_in": false,
  "v3_cloud_backup": false,
  "v3_premium_iap": false
}
```

Behavior:
- Safe defaults are all `false`.
- If remote fetch fails or config is missing, app keeps safe defaults.
- Flags are refreshed at home screen load and can be refreshed manually from `QA Debug: Feature Flags`.
