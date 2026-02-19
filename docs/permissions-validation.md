# V2 Permission Validation

## Config checks

- iOS key present: `ios.infoPlist.NSMicrophoneUsageDescription`
- Android permission present: `android.permissions` includes `RECORD_AUDIO`

## Device QA checklist

### iOS

1. Install preview/dev build on iOS device.
2. Start a session and tap `Record` in any drill section.
3. Verify iOS permission dialog appears with Speak90 microphone purpose text.
4. Tap `Don't Allow`:
  - verify non-blocking fallback message appears
  - verify session can continue and complete
5. Tap `Allow`:
  - verify recording starts/stops and playback works

### Android

1. Install preview/dev build on Android device.
2. Start a session and tap `Record` in any drill section.
3. Verify Android microphone permission dialog appears.
4. Tap `Deny`:
  - verify non-blocking fallback message appears
  - verify session can continue and complete
5. Tap `Allow`:
  - verify recording starts/stops and playback works

## Expected result

- Permission is requested only on first recording attempt.
- Denial does not crash or block the session flow.
- Grant enables recording and playback features.
