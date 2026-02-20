# Speak90 MVP Jira Tickets

## Epic: MVP Core Experience

### Ticket 1: Set up Expo RN app with core libs

**Type**: Story  
**Priority**: P0  
**Description**: Initialize the Expo React Native app with TypeScript and core dependencies required for MVP.  
**Acceptance Criteria**:

- App builds on iOS and Android simulators
- TypeScript configured
- Dependencies installed: Zustand, AsyncStorage, React Navigation (or chosen nav), `react-native-google-mobile-ads` (placeholder ok), `expo-av`
- Project structure ready for screens/components

---

### Ticket 2: Days JSON data model + loader

**Type**: Story  
**Priority**: P0  
**Description**: Define Day/Section types and load Days 1–10 from `assets/data/days.json`.  
**Acceptance Criteria**:

- `Day` and `SessionSection` types exist
- `assets/data/days.json` added with Days 1–10
- JSON loader returns a list of days and validates basic shape

---

### Ticket 3: Home screen with day + streak + banner

**Type**: Story  
**Priority**: P0  
**Description**: Build Home screen showing current day, streak, start session CTA, and banner ad slot.  
**Acceptance Criteria**:

- Home shows `Day X` and `Streak`
- Start button navigates to Session
- Banner ad placeholder renders

---

### Ticket 4: SessionRunner shell with timer + next

**Type**: Story  
**Priority**: P0  
**Description**: Create a SessionRunner that iterates through sections with timer and manual Next.  
**Acceptance Criteria**:

- Section title + current sentence displayed
- Timer counts down per section
- Next advances to next sentence/section

---

### Ticket 5: Implement MVP section types

**Type**: Story  
**Priority**: P0  
**Description**: Implement all MVP section behaviors: Warm‑up, Verbs, Sentences, Modals, Patterns, Anki, Free Output.  
**Acceptance Criteria**:

- All 7 section types render
- Patterns section supports EN→DE prompt + mark complete
- Anki section supports Again/Good/Easy
- Free Output shows prompt + timer

---

### Ticket 6: Progress + streak logic

**Type**: Story  
**Priority**: P0  
**Description**: Persist user progress and streak in AsyncStorage.  
**Acceptance Criteria**:

- Progress stored: `currentDay`, `streak`, `sessionsCompleted`, `totalMinutes`
- Streak updates on completed session
- Rules for day advancement are implemented and documented

---

### Ticket 7: Session Complete screen

**Type**: Story  
**Priority**: P1  
**Description**: Show completion screen with total session time.  
**Acceptance Criteria**:

- Displays total elapsed session time
- CTA returns to Home

---

### Ticket 8: AdMob integration

**Type**: Story  
**Priority**: P1  
**Description**: Integrate AdMob with banner on Home and interstitial after session.  
**Acceptance Criteria**:

- AdMob config added to `app.json`
- Banner displays on Home
- Interstitial shown after session completion
- Fallback if ad fails to load

---

### Ticket 9: EAS build setup

**Type**: Story  
**Priority**: P1  
**Description**: Configure EAS build for iOS/Android and generate internal build.  
**Acceptance Criteria**:

- `eas.json` configured
- Build commands documented
- Internal build produced

---

## Epic: Spec Clarifications (MVP)

### Ticket 10: Clarify section count + timing

**Type**: Task  
**Priority**: P0  
**Description**: Resolve mismatch between “5 sections” vs 7 listed sections and finalize durations.  
**Resolution (Feb 19, 2026)**:

- Final MVP section count is **7**
- Active drill time is **40 minutes** total
- Target elapsed session time remains **~45 minutes** with transitions/interactions
- PRD updated to replace all “5 sections” references with “7 sections”

**Acceptance Criteria**:

- Final list of sections approved
- Total session time defined and consistent

---

### Ticket 11: Define streak + day advancement rules

**Type**: Task  
**Priority**: P0  
**Description**: Define rules for streaks and progression.  
**Resolution (Feb 19, 2026)**:

- Streak uses local device day boundaries (`YYYY-MM-DD`)
- Same-day repeat completion does not increment streak twice
- If last completion was yesterday: `streak + 1`
- If last completion is older than yesterday: streak resets to `1`
- `currentDay` unlocks only when completed day equals current unlocked day
- Completing older/out-of-order days does not unlock further days
- `currentDay` is capped to available content length (MVP: 10 days)

**Acceptance Criteria**:

- Streak reset logic defined (timezone + missed day)
- Rules for unlocking next day defined

---

### Ticket 12: Define session time metric

**Type**: Task  
**Priority**: P1  
**Description**: Specify whether “totalMinutes” is elapsed time or spoken time.  
**Resolution (Feb 19, 2026)**:

- `totalMinutes` is defined as cumulative **elapsed session minutes**
- Per-session minutes are computed as `round(sessionElapsedSeconds / 60)`
- Metric is persisted in `UserProgress.totalMinutes`
- MVP UI uses **elapsed** wording and avoids `spoken minutes` phrasing

**Acceptance Criteria**:

- Metric definition documented and used in UI

---

### Ticket 13: Confirm Anki card data source

**Type**: Task  
**Priority**: P1  
**Description**: Decide whether Anki cards are hardcoded or embedded in Days JSON.  
**Resolution (Feb 19, 2026)**:

- Canonical source is `speak_data/Day_<N>_Anki_Spoken_First*.csv`
- App runtime source is `assets/data/days.json` (`anki-a.sentences`)
- Data pipeline uses CSV `Back` values (German side) to populate JSON
- No hardcoded Anki cards in code for MVP
- Source-exact card counts are preserved per day

**Acceptance Criteria**:

- Data source specified
- Example data provided

---

### Ticket 14: Clarify ad rules

**Type**: Task  
**Priority**: P1  
**Description**: Define interstitial timing/skip rules and behavior on abort.  
**Resolution (Feb 19, 2026)**:

- Home banner is always attempted on Home; fallback placeholder is shown on load failure
- Interstitial is eligible only after full session completion
- Interstitial trigger point: user taps `Back Home` on Session Complete
- Interstitial is shown at most once per completed session
- If interstitial is unavailable/failed, app navigates to Home without blocking
- Session abort/early exit does not trigger interstitial

**Acceptance Criteria**:

- Interstitial display rules documented
- Abort handling documented

---

### Ticket 15: Permissions policy

**Type**: Task  
**Priority**: P2  
**Description**: Decide whether microphone permission is required for MVP.  
**Resolution (Feb 19, 2026)**:

- Microphone permission is **not required** for MVP
- `app.json` remains without iOS mic usage description and without Android `RECORD_AUDIO`
- Store requirements updated to `None for MVP` permissions
- Microphone permission will be added only with V2 recording features

**Acceptance Criteria**:

- Store permission list matches actual app behavior
- If no recording in MVP, microphone permission removed

---

## Epic: Version 2.0 - Speaking Practice

### Ticket 16: Recording abstraction + permission flow

**Type**: Story  
**Priority**: P0  
**Description**: Add local audio recording controls to session drills with explicit microphone permission request at first record attempt.  
**Acceptance Criteria**:

- Recording controls exist on drill sections (`Record`, `Stop`, `Play last`)
- Microphone permission requested contextually on first use
- Permission denial is handled gracefully (non-blocking fallback UI)
- Recordings default to local-only storage in app documents directory

---

### Ticket 17: Persist recordings to FileSystem + retention policy

**Type**: Story  
**Priority**: P0  
**Description**: Persist recorded files locally with metadata and enforce retention policy for storage growth control.  
**Acceptance Criteria**:

- Recordings saved under app document directory with per-session naming convention
- Metadata includes `dayNumber`, `sectionId`, timestamp, file URI, duration
- Retention policy implemented (default 30 days)
- User can clear recordings from settings/control surface

---

### Ticket 18: Playback component with progress + seek

**Type**: Story  
**Priority**: P1  
**Description**: Build playback controls for recorded clips with progress visibility and seek support.  
**Acceptance Criteria**:

- Play/Pause for selected recording
- Progress bar updates during playback
- User can seek within the recording
- Playback failures show non-blocking error/fallback state

---

### Ticket 19: Expand content to Days 1-90 JSON + loader compatibility

**Type**: Story  
**Priority**: P0  
**Description**: Expand canonical app content from Days 1-10 to Days 1-90 while preserving section schema and runtime loader validation.  
**Acceptance Criteria**:

- `assets/data/days.json` contains Days `1..90`
- Loader validates full 90-day sequence and schema
- Existing session flow works for any valid day
- Data import process from canonical source is documented

---

### Ticket 20: SRS (Leitner) engine + persistence

**Type**: Story  
**Priority**: P0  
**Description**: Implement local SRS review state using Leitner boxes with due-date scheduling and daily cap.  
**Acceptance Criteria**:

- `SrsCard` local model implemented with box/review fields
- Leitner intervals configured (`[1,3,7,14,30]` days)
- Daily queue selection honors due cards and cap (default 50)
- Review actions map correctly (`Again`, `Good`, `Easy`) and persist

---

### Ticket 21: Stats screen (sessions + review metrics)

**Type**: Story  
**Priority**: P1  
**Description**: Add stats surface for streaks, session totals, and SRS outcomes.  
**Acceptance Criteria**:

- Stats screen shows streak, sessions completed, total elapsed minutes
- SRS metrics shown (due today, review outcomes, accuracy trend/basic summary)
- Data reads from local persisted progress/SRS state
- Screen is reachable from home/session completion flow

---

### Ticket 22: Local daily notifications

**Type**: Story  
**Priority**: P1  
**Description**: Add local reminder notifications with configurable daily time and optional snooze behavior.  
**Acceptance Criteria**:

- Notification permission request with explanatory prompt
- Daily reminder scheduling at user-selected local time (default 19:00)
- Optional snooze action (+30 minutes)
- Settings allow enabling/disabling reminders

---

### Ticket 23: Analytics instrumentation for V2 events

**Type**: Story  
**Priority**: P1  
**Description**: Instrument key V2 events for recording, playback, SRS reviews, and notification opt-in.  
**Acceptance Criteria**:

- Events added for record start/stop, playback start/stop, card reviewed, notification opt-in
- Event payload includes core dimensions (`dayNumber`, `sectionId`, app version)
- No raw audio payload or transcript content is logged
- Analytics implementation documented for QA verification

---

### Ticket 24: Storage sweeper job for recordings

**Type**: Task  
**Priority**: P2  
**Description**: Add scheduled cleanup routine that removes recordings older than retention window.  
**Acceptance Criteria**:

- Sweeper runs on app start and/or periodic trigger
- Files older than retention threshold are removed
- Metadata index stays consistent after deletions
- Failures do not crash session flow

---

### Ticket 25: V2 permissions + policy update

**Type**: Task  
**Priority**: P0  
**Description**: Update app permissions and policy docs for microphone-enabled V2 feature set.  
**Acceptance Criteria**:

- iOS microphone usage description added for V2 builds
- Android `RECORD_AUDIO` permission added for V2 builds
- PRD and store submission notes updated to reflect V2 permission scope
- Permission behavior validated on both iOS and Android

---

## V3 Tickets

### Ticket 26: Feature flags + remote config gates for V3

**Type**: Story  
**Priority**: P0  
**Description**: Add remote-config backed feature flags to gate V3 features (STT, cloud backup, premium) with staged rollout support.  
**Acceptance Criteria**:

- Config keys added for `v3_stt_on_device`, `v3_stt_cloud_opt_in`, `v3_cloud_backup`, `v3_premium_iap`
- Safe local defaults (`false`) when remote fetch fails
- Flags can be updated without app release
- QA debug surface shows current flag values

---

### Ticket 27: On-device STT scoring shell

**Type**: Story  
**Priority**: P0  
**Description**: Implement on-device pronunciation scoring pipeline and integrate into session recording flow.  
**Acceptance Criteria**:

- `stt_scored` result generated locally after recording for supported devices
- Score normalized to `0..100`
- UX shows score + basic feedback state (`good`, `needs work`)
- Unsupported devices gracefully fallback without breaking session

---

### Ticket 28: Consent flow for cloud audio processing

**Type**: Story  
**Priority**: P0  
**Description**: Add explicit consent modal before any audio upload/STT cloud call and persist consent audit locally.  
**Acceptance Criteria**:

- Consent modal shown before first cloud action
- Modal explains upload purpose, retention, and opt-out
- Consent decision persisted with timestamp
- If consent denied, app remains fully usable in local-only mode

---

### Ticket 29: Cloud recording upload + retention policy

**Type**: Story  
**Priority**: P1  
**Description**: Implement opt-in cloud upload pipeline for recordings with metadata and retention controls. Premium cloud audio is stored for 90 days to match the 90-day program.  
**Acceptance Criteria**:

- Upload API integration for recording files + metadata
- Upload only when user consent + cloud backup enabled
- Server/client retention default set to 90 days
- User can disable backup and stop future uploads
- Premium cloud audio is stored for 90 days to match the 90-day program

---

### Ticket 30: Backend sync endpoints integration

**Type**: Story  
**Priority**: P0  
**Description**: Integrate mobile app with backend endpoints for progress sync and recordings list/upload lifecycle.  
**Acceptance Criteria**:

- Device registration/auth token flow integrated
- Progress sync request/response implemented and retriable
- Recording list endpoint integration for restore flows
- Network failures handled without data loss/crash

**Backend Sub-ticket Breakdown**

### Ticket 30.1: API contract foundation + auth/session

**Type**: Task  
**Priority**: P0  
**Description**: Define backend contract and implement device session auth as prerequisite for all sync endpoints.  
**Endpoints**:

- `POST /v1/auth/device-session`
- `GET /v1/config/flags`

**Request/Response contract (minimum)**:

- `POST /v1/auth/device-session` request: `{ deviceId, platform, appVersion }`
- `POST /v1/auth/device-session` response: `{ accessToken, refreshToken?, expiresAt, userIdOrDeviceId }`
- `GET /v1/config/flags` response: `{ v3_stt_on_device, v3_stt_cloud_opt_in, v3_cloud_backup, v3_premium_iap }`

**DB tables**:

- `device_sessions(id, device_id, platform, app_version, access_token_hash, refresh_token_hash, expires_at, created_at, updated_at)`
- `feature_flags(key, enabled, rollout_percent, updated_at, updated_by)`

**Acceptance Criteria**:

- Mobile receives valid token and can call protected endpoints
- Remote flags are fetched without app release
- Token expiry/refresh behavior documented

---

### Ticket 30.2: Consent + cloud backup settings APIs

**Type**: Task  
**Priority**: P0  
**Description**: Persist and sync cloud-audio consent and cloud backup enablement state.  
**Endpoints**:

- `POST /v1/consents/audio-cloud`
- `GET /v1/consents/audio-cloud`
- `PUT /v1/user/settings/backup`
- `GET /v1/user/settings/backup`

**Request/Response contract (minimum)**:

- Consent write request: `{ decision: "granted"|"denied", decidedAt, policyVersion }`
- Consent read response: `{ decision, decidedAt, policyVersion } | null`
- Backup settings write request: `{ enabled, retentionDays?: 90 }`
- Backup settings read response: `{ enabled, retentionDays }`

**DB tables**:

- `user_consents(id, subject_id, consent_type, decision, policy_version, decided_at, created_at)`
- `user_settings(id, subject_id, cloud_backup_enabled, backup_retention_days, updated_at)`

**Acceptance Criteria**:

- Consent state round-trips between client and backend
- Backup enable/disable is persisted server-side
- Default retention resolves to 90 days

---

### Ticket 30.3: Recording upload/list/delete + retention execution

**Type**: Task  
**Priority**: P0  
**Description**: Implement recording lifecycle endpoints and retention execution path for cloud artifacts.  
**Endpoints**:

- `POST /v1/audio/uploads`
- `GET /v1/audio/uploads`
- `DELETE /v1/audio/uploads/:uploadId`
- `POST /v1/audio/uploads/purge`

**Request/Response contract (minimum)**:

- Upload request: multipart `file` + `{ dayNumber, sectionId, createdAt, durationMs, retentionDays }`
- Upload response: `{ uploadId, uri, uploadedAt, retentionDays }`
- List response: `[{ uploadId, dayNumber, sectionId, durationMs, createdAt, uploadedAt, expiresAt }]`
- Purge response: `{ deletedCount, retentionDays, executedAt }`

**DB tables**:

- `recording_uploads(id, subject_id, storage_key, file_uri, day_number, section_id, duration_ms, created_at_client, uploaded_at, expires_at, status)`
- `retention_jobs(id, job_type, started_at, finished_at, deleted_count, status, error_message)`

**Acceptance Criteria**:

- Upload succeeds only with valid auth + consent + backup enabled
- Client can restore list view from backend response
- Purge enforces default 90-day policy

---

### Ticket 30.4: Progress + SRS sync endpoints

**Type**: Task  
**Priority**: P1  
**Description**: Add progress and SRS sync APIs for multi-device continuity.  
**Endpoints**:

- `PUT /v1/progress`
- `GET /v1/progress`
- `PUT /v1/srs/cards/bulk`
- `GET /v1/srs/cards`
- `POST /v1/srs/reviews`
- `POST /v1/sessions/complete`

**Request/Response contract (minimum)**:

- Progress upsert request: `{ currentDay, streak, totalMinutes, sessionsCompleted, updatedAt }`
- SRS bulk request: `{ cards: [{ cardId, box, dueAt, reviewCount, updatedAt }] }`
- Review append request: `{ cardId, result, reviewedAt }`

**DB tables**:

- `user_progress(id, subject_id, current_day, streak, total_minutes, sessions_completed_json, updated_at)`
- `srs_cards(id, subject_id, card_id, box, due_at, review_count, updated_at)`
- `srs_reviews(id, subject_id, card_id, result, reviewed_at, created_at)`
- `session_completions(id, subject_id, day_number, elapsed_seconds, completed_at)`

**Acceptance Criteria**:

- Progress and SRS state sync correctly across installs/devices
- Upserts are idempotent and retry-safe
- Conflicts resolved by `updatedAt` (last-write-wins baseline)

---

### Ticket 30.5: Observability + analytics ingestion endpoint

**Type**: Task  
**Priority**: P1  
**Description**: Add backend ingest endpoint and auditability for client events used in QA/monitoring.  
**Endpoints**:

- `POST /v1/analytics/events`

**Request/Response contract (minimum)**:

- Request: `{ events: [{ name, occurredAt, payload }] }`
- Response: `{ accepted, rejected, requestId }`

**DB tables**:

- `analytics_events(id, subject_id, name, occurred_at, payload_json, created_at)`

**Acceptance Criteria**:

- Supports current app events (`record_*`, `playback_*`, `card_reviewed`, `stt_scored`, `notification_opt_in`)
- Payload validation rejects malformed events gracefully
- No raw audio bytes or transcript text stored

---

### Rollout Order (recommended)

1. `Ticket 30.1` auth/session + flags
2. `Ticket 30.2` consent + backup settings
3. `Ticket 30.3` recording upload/list/delete/purge
4. `Ticket 30.4` progress + SRS sync
5. `Ticket 30.5` analytics ingestion + observability hardening

### MVP-only endpoint subset (reduced scope)

Use this subset to ship the first backend-connected release quickly:

- `POST /v1/auth/device-session`
- `GET /v1/config/flags`
- `POST /v1/consents/audio-cloud`
- `GET /v1/consents/audio-cloud`
- `PUT /v1/user/settings/backup`
- `GET /v1/user/settings/backup`
- `POST /v1/audio/uploads`
- `GET /v1/audio/uploads`
- `PUT /v1/progress`
- `GET /v1/progress`

Deferred from MVP:

- `DELETE /v1/audio/uploads/:uploadId`
- `POST /v1/audio/uploads/purge` (run retention as scheduled backend job only)
- `PUT /v1/srs/cards/bulk`
- `GET /v1/srs/cards`
- `POST /v1/srs/reviews`
- `POST /v1/sessions/complete`
- `POST /v1/analytics/events`

---

### Ticket 31: In-app purchase integration (premium unlock)

**Type**: Story  
**Priority**: P0  
**Description**: Add purchase flow for one-time premium unlock and entitlement persistence.  
**Acceptance Criteria**:

- Purchase attempt/success/failure flow implemented on iOS + Android
- Entitlement persisted locally after verified purchase
- Premium mode disables ads
- Premium entitlement gates cloud backup/cloud audio features with 90-day cloud retention
- Restore purchase flow available from settings

---

### Ticket 32: Server-side receipt verification integration

**Type**: Story  
**Priority**: P0  
**Description**: Validate platform purchase receipts with backend and enforce entitlement from verification response.  
**Acceptance Criteria**:

- App sends receipt payload to backend verify endpoint
- Entitlement granted only after successful server verification
- Invalid/expired receipts are rejected cleanly
- Purchase analytics events emitted (`purchase_attempt`, `purchase_success`, `purchase_restore`)

---

### Ticket 33: GDPR data export + deletion client flows

**Type**: Story  
**Priority**: P1  
**Description**: Implement client UX and API integration for data export and account/device data deletion requests.  
**Acceptance Criteria**:

- Export request flow available in settings
- Delete data flow available in settings with explicit confirmation
- Deletion clears local data and calls backend delete endpoint
- User receives visible completion/failure state

---

### Ticket 34: V3 analytics expansion

**Type**: Story  
**Priority**: P1  
**Description**: Extend analytics taxonomy for V3 flows (STT, premium funnel, cloud backup consent/usage).  
**Acceptance Criteria**:

- Events added: `stt_scored`, `purchase_attempt`, `purchase_success`, `purchase_restore`, cloud consent events
- Event payloads include app + feature dimensions
- No raw audio/transcript content logged without explicit product/legal approval
- Analytics QA matrix updated

---

### Ticket 35: Monitoring + cost guardrails (backend aware client hooks)

**Type**: Task  
**Priority**: P1  
**Description**: Add operational hooks and client-side limits to reduce STT/storage cost and support observability.  
**Acceptance Criteria**:

- Client rate limit guard for cloud STT requests
- Upload retry policy with capped backoff implemented
- Error telemetry for upload/STT/purchase failures enabled
- Documentation includes SLO/cost alert expectations

---

### Ticket 36: V3 end-to-end QA and rollout checklist

**Type**: Task  
**Priority**: P0  
**Description**: Prepare launch-ready QA plan for staged V3 rollout (5% → 25% → 100%).  
**Acceptance Criteria**:

- E2E test checklist for purchase + restore + consent + cloud scoring
- Feature-flag rollout playbook documented
- Rollback criteria and owner assignments documented
- Pilot readiness checklist signed off
