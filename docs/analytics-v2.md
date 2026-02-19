# V2 Analytics Instrumentation (Ticket 23)

## Events

All events include core dimensions:

- `dayNumber`
- `sectionId`
- `appVersion`

Event names implemented:

- `record_start`
- `record_stop`
- `playback_start`
- `playback_stop`
- `card_reviewed`
- `notification_opt_in`

## Payload notes

- Recording and playback events include timing metadata (`durationMs`, `positionMs`) only.
- SRS review event includes grade + Leitner transition (`previousBox`, `nextBox`).
- Notification opt-in includes enable/permission outcome + selected reminder time.
- No raw audio bytes, file content, or transcript text is logged.

## QA verification

Instrumentation currently uses structured console logs:

```text
[analytics] <event_name> { ...payload }
```

### Checklist

1. Start recording in a session:
  - Expect `record_start`.
2. Stop and save recording:
  - Expect `record_stop`.
3. Play and pause/finish recording:
  - Expect `playback_start` and `playback_stop`.
4. In Anki section, grade a card:
  - Expect `card_reviewed` with `grade`.
5. Enable daily reminder from Home:
  - Expect `notification_opt_in` with `status: granted` or `status: denied`.

## Code locations

- Analytics utility: `src/analytics/events.ts`
- Recorder instrumentation: `src/audio/useSessionRecorder.ts`
- SRS review instrumentation: `src/data/srs-store.ts`
- Notification opt-in instrumentation: `src/screens/home/HomeScreen.tsx`
