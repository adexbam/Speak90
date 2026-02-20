# Speak90 - 90-Day German Speaking Coach

## Product Requirements Document (PRD)

**Version**: 2.0  
**Date**: February 19, 2026  
**Author**: Senior Product Manager  
**Status**: APPROVED FOR ENGINEERING  
**Target Platforms**: iOS & Android (React Native / Expo)  
**MVP Launch**: March 4, 2026  

---

## 1. EXECUTIVE SUMMARY

**Problem**: Language learners need consistent daily speaking practice. Current apps focus on vocabulary/gamification but neglect structured speaking routines.

**Solution**: Mobile app that digitizes a proven 45-minute daily German speaking routine (Days 1-90) with timers, progress tracking, audio recording, and **Google AdMob monetization**.

**Success Metric**: User completes 7 consecutive days (Week 2)
**Revenue Model**: Free with interstitial ads + banner ads

---

## 2. TARGET AUDIENCE

**Primary**: A1-B1 German learners doing structured speaking practice

- Software engineers/tech workers in Germany  
- Busy professionals (45min daily discipline)
- Berlin/Germany residents + remote learners

---

## 3. PRODUCT VERSIONS & SCOPE

### VERSION 1.0 - MVP (Week 1-2) **[ENGINEERING PRIORITY]**

| Section | Duration | Features | Implementation |
| --------- | ---------- | ---------- | ---------------- |
| **Home** | - | "Day X • Streak: N 🔥" → **START SESSION** | Days 1-10 JSON |
| **1. Warm-up** | 5min | 4 sentences × 5 reps | Timer + ✓ button |
| **2A. Core Verbs** | 3min | 5 verbs × 10 reps | "Ich sehe." etc. |
| **2B. Sentences** | 4min | 5 sentences × 5 reps | "Ich sehe das." |
| **2C. Modals** | 3min | 5 sentences × 3 reps | "Ich will das sehen." |
| **3. Patterns** | 10min | EN→DE flashcards | Speak aloud → ✓ |
| **4. Anki Review** | 10min | Source CSV cards (day-specific) | Again/Good/Easy |
| **5. Free Output** | 5min | Timer + "Heute..." prompt | End session |

**Progress**: Local storage (streak, days completed)
**Ads**: Interstitial after session + Home banner

### MVP Clarification (Ticket 10 - Feb 19, 2026)

- **Final section count**: **7 sections** (Warm-up, Core Verbs, Sentences, Modals, Patterns, Anki Review, Free Output)
- **Timing definition**:
  - Active drill time = **40 minutes** total (`5 + 3 + 4 + 3 + 10 + 10 + 5`)
  - Typical elapsed session time = **~45 minutes** including transitions and user interaction time
- Engineering, QA, and KPI tracking should use this as the source of truth for MVP.

### VERSION 2.0 - Speaking Practice (Week 3-5)

✅ Audio recording + playback (ALL drills)
✅ Full 90 days JSON config
✅ Real SRS (50 cards, Leitner system)
✅ Stats screen + daily notifications

### VERSION 3.0 - Scale (Week 6-10)

Speech-to-text pronunciation scoring

Backend sync (Node.js API)

Premium ad-free ($2.99 one-time)

---

## 4. TECHNICAL SPECIFICATIONS

### Tech Stack (MVP)

FRONTEND: React Native + Expo (SDK 51+)
STATE: Zustand (session) + AsyncStorage (progress)
AUDIO: expo-av (record/playback)
ADS: react-native-google-mobile-ads (AdMob)
DATA: Days JSON in /assets/data/days.json
BUILD: EAS Build (TestFlight + Play Store)

### Data Models (TypeScript)

```typescript
interface SessionSection {
  id: string;
  type: 'warmup' | 'verbs' | 'patterns' | 'anki' | 'free';
  title: string;
  sentences: string[];
  reps: number;
  duration: number; // seconds
}

interface Day {
  dayNumber: number;
  sections: SessionSection[];
}

interface UserProgress {
  currentDay: number;
  streak: number;
  sessionsCompleted: number[];
  totalMinutes: number;
}

Sample Days JSON

[
  {
    "dayNumber": 4,
    "sections": [
      {
        "id": "warmup",
        "type": "warmup",
        "title": "Warm-up (5min)",
        "sentences": ["Ich weiß nicht.", "Keine Ahnung.", "Mal sehen.", "Das kommt darauf an."],
        "reps": 5,
        "duration": 300
      },
      {
        "id": "verbs-a", 
        "type": "verbs",
        "title": "Core Verbs (10min)",
        "sentences": ["Ich sehe.", "Ich höre.", "Ich spreche.", "Ich frage.", "Ich antworte."],
        "reps": 10,
        "duration": 180
      }
    ]
  }
]

### Progression & Streak Rules (Ticket 11 - Feb 19, 2026)

- **Timezone basis**: user local device calendar day (`YYYY-MM-DD` local date key)
- **Streak update on session complete**:
  - If a session was already completed **today**, streak does **not** increment again
  - If last completion date was **yesterday**, streak increments by `+1`
  - If last completion date is older than yesterday (missed day), streak resets to `1`
- **Day advancement (unlocking next day)**:
  - `currentDay` advances only when the completed session day equals current unlocked day
  - Completing older or out-of-order days does not advance `currentDay`
  - `currentDay` is capped at available content length (MVP: Day 10)
- **Progress fields persisted after completion**:
  - `currentDay`, `streak`, `sessionsCompleted`, `totalMinutes`, `lastCompletedDate`

### Session Time Metric (Ticket 12 - Feb 19, 2026)

- **Canonical metric**: `totalMinutes` = cumulative **elapsed session minutes**
- **Definition**:
  - Count wall-clock time while a session is active (timer running)
  - Store per-session value as `round(sessionElapsedSeconds / 60)`
  - Accumulate into `UserProgress.totalMinutes`
- **Exclusions**:
  - Not speech-detected minutes
  - Not microphone-based "spoken minutes"
- **UI wording standard**:
  - Use **elapsed** terminology (for example: `Total elapsed`)
  - Avoid ambiguous `spoken` phrasing for MVP metrics

### Anki Data Source (Ticket 13 - Feb 19, 2026)

- **Canonical source**: per-day CSV files in `speak_data/`
  - Preferred filename: `Day_<N>_Anki_Spoken_First.csv`
  - Fallback filename: `Day_<N>_Anki_Spoken_First_Archive.csv`
- **Transformation for app data**:
  - For each day, map CSV `Back` column (German side) into `assets/data/days.json` section `anki-a.sentences`
- **MVP scope**:
  - Days `1..10` only
  - Use source-exact card count per day (no normalization)

5. USER FLOWS
1. Home → "Day 4 -  Streak: 3 🔥 -  42min avg" [START SESSION]
2. Warm-up → "Ich weiß nicht." [Repeat 5x] [00:28] [✓ Next]
3. Auto/manual advance through 7 sections  
4. "Session Complete! 44min elapsed" → **AdMob Interstitial (5s)**
5. Home → Banner ad + streak updated

6. AdMob Integration
app.config.js / env Configuration

{
  "EXPO_PUBLIC_ADMOB_ANDROID_APP_ID": "<required in production>",
  "EXPO_PUBLIC_ADMOB_IOS_APP_ID": "<required in production>",
  "EXPO_PUBLIC_ADMOB_BANNER_ID": "<required in production>",
  "EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID": "<required in production>"
}

Ad Placement Rules
### Ad Rules Clarification (Ticket 14 - Feb 19, 2026)

- **Banner (Home)**:
  - Show banner on Home screen
  - If banner fails to load, show placeholder/fallback UI
- **Interstitial (Session Complete)**:
  - Eligible only after a **successfully completed** session
  - Trigger when user taps **Back Home** on Session Complete
  - Show at most once per completed session
  - If interstitial is not loaded or fails, continue navigation to Home (no blocking)
- **Abort behavior**:
  - If user exits or abandons session before completion, do **not** show interstitial

COLORS:
- Background: #1a1a1a (dark mode default)
- Text: #ffffff  
- Accent: #10b981 (green ✓ button)
- Record: #ef4444 (red button)

TYPOGRAPHY:
- Session headers: 24pt bold
- German sentences: 20pt regular
- Timer: 48pt countdown

KEY SCREENS:
Home: [Day 4] [Streak 🔥] [START] [Banner Ad]
Session: Fullscreen sentence + [00:28] + [✓ Next 120pt]

8. STORE REQUIREMENTS
| Store      | Account Cost | Review Time | Permissions  |
| ---------- | ------------ | ----------- | ------------ |
| App Store  | $99/year     | 1-3 days    | Microphone (`NSMicrophoneUsageDescription`) for V2 recording |
| Play Store | $25 once     | 24-72h      | `RECORD_AUDIO` for V2 recording |

### Permissions Policy (Ticket 15 - Feb 19, 2026)

- MVP does **not** request microphone access
- `app.json` must not include `NSMicrophoneUsageDescription` (iOS) or `RECORD_AUDIO` permission (Android) for MVP
- Microphone permission is introduced only when recording features ship (planned for V2)

### V2 Permissions Policy (Ticket 25 - Feb 19, 2026)

- V2 includes audio recording; microphone access is required on iOS/Android.
- iOS: include `NSMicrophoneUsageDescription` with user-facing purpose text.
- Android: include `RECORD_AUDIO` permission in app config.
- Request microphone permission contextually at first record attempt (not at cold start).
- If denied, keep session flow non-blocking and show fallback guidance.

9. DEVELOPMENT TIMELINE
WEEK 1 (Feb 19-25):
☐ Home screen + Day list (2 days)
☐ SessionRunner component (3 days)  
☐ LocalStorage progress (1 day)
☐ Days 1-10 JSON (1 day)

WEEK 2 (Feb 26-Mar 4):
☐ AdMob integration (2 days)
☐ EAS Build → TestFlight/Internal Test (2 days)
☐ PM validates 3-day completion (1 day)

10. SUCCESS METRICS
MVP KPIs (Week 2):
- D1-D7 retention: 70%+
- Avg session time: 35+ minutes
- 80% complete all 7 sections


11. APPROVALS
Product Manager: ✅ APPROVED Feb 19, 2026
Engineering Lead: ____________________

IMMEDIATE NEXT STEPS:

Create Days 1-10 JSON today

Build SessionRunner component by Feb 21

Test 1 full session on Expo Go by Feb 22


# Speak90 — Expanded PRD (detailed Versions 2.0 & 3.0)

From a **senior mobile product engineer perspective (React Native + Expo, shipping-first, privacy-first, engineering-ready)** — I expanded Versions **2.0** and **3.0** with the missing engineering, data, privacy, and implementation detail you asked for. This is actionable: includes data formats, storage, APIs, acceptance criteria, tickets, KPIs, risks, and rollout guidance.

---

# Version 2.0 — Speaking Practice (Week 3–5) — Detailed Spec

### Goals (user-facing)

* Add **local audio recording + playback** for every drill.
* Expand content to full **Days 1–90 JSON**.
* Implement a **Real SRS (Leitner)** for review cards (50-card working set).
* Add **Stats screen** (session history, streaks, totalMinutes, review success) and **Local daily notifications**.

---

## 2.0 Architecture & Surface-level changes

* Frontend: existing RN + Expo codebase.
* Audio: `expo-av` for recording/playback (MVP) with a thin audio abstraction layer.
* Persistent store: AsyncStorage for small state + a local indexed DB if needed (e.g., **WatermelonDB** or **MMKV** via native modules) for SRS card state and recordings metadata.
* File storage: recordings stored in app document directory (`FileSystem.documentDirectory`) with a per-session folder.
* UI: Record/Stop/Play controls on Session screen; Record icon shown only when V2 enabled.

---

## 2.0 Data & Formats

### Recording format & constraints (recommended)

* **Format:** `.m4a` (AAC) — good size/quality tradeoff on mobile.
* **Sample rate:** 44.1 kHz (device default).
* **Mono**, 16-bit.
* **Max per-recording size:** 10 MB (enforced by duration cap or auto-chop).
* **Per-session retention:** keep last N recordings (configurable), default keep 30 days.
* **Filenames:** `session_<YYYYMMDD>_day<N>_section<id>_<timestamp>.m4a`.

### Directory structure (on device)

```plaintext

/documents/speak90/
  recordings/
    2026-02-20/
      session_20260220_day4_section_warmup_1645.m4a
  db/
    srs.json
    stats.json

```

### SRS (Leitner) schema (local)

TypeScript interfaces:

```ts
interface SrsCard {
  id: string; // stable id (from CSV -> JSON)
  front: string; // English prompt (optional)
  back: string; // German sentence
  box: number; // 1..N (Leitner box)
  lastReviewedAt?: string; // ISO date
  nextReviewAt?: string;   // ISO date
  reviewCount: number;
  easeFactor?: number; // optional for SM-2 hybrid
}
```

Default Leitner config:

- Boxes: 5
- Intervals (days) per box: [1, 3, 7, 14, 30]
- Review selection:

  - Today’s queue = cards with `nextReviewAt <= today OR box === 1`
  - Daily review cap: 50 cards (configurable)

Persistence: `srs.json` in local db directory or in AsyncStorage for MVP (but move to local DB if SRS grows).

---

## 2.0 Feature Implementation Details

### Recording + Playback

- **UI**: Record button (circular red) shown in section header for recordable sections (all drills). Controls: Record / Pause / Stop / Play last / Delete last.
- **Behavior**:

  - Recording starts when user taps Record.
  - Max record segment length: 5 minutes (per section the section duration will usually be less).
  - If user records multiple times in a section, keep the 3 most recent by default.
  - Playback plays the selected file using `expo-av` with progress bar + scrub.
- **Permissions**: Request `RECORD_AUDIO` at time of first record attempt with contextual consent sheet (explain local-only recording for V2).
- **Fallback**: If permission denied, show unobtrusive message and disable recording controls.

### Storage & Retention

- Keep recordings on-device only in V2 (no upload).
- Retention policy:

  - Keep last 30 days by default.
  - Provide Settings → Storage → Clear recordings (user action).
- Encryption: optional — not part of MVP but recommended for PII-sensitive markets.

### UI + UX details

- Small waveform visual (peak-only) for playback (simple implementation: show progress bar + amplitude indicator).
- “Tap to Playback” inline with sentence card.
- Recording indicator and haptic feedback on start/stop.

### SRS / Leitner

- Import 50-card pool from Days JSON on first run of V2 (per user).
- Provide Stats screen with:

  - Cards due today
  - Accuracy rate (Again/Good/Easy split)
  - Average session review time
- For review responses use same three-button model: `Again` (moves to box 1), `Good` (advance one box), `Easy` (advance two boxes or apply ease factor). Optionally support SM-2 hybrid: store easeFactor to apply spacing.

### Notifications

- Local push notifications (Expo Notifications / `expo-notifications`).
- Default scheduling:

  - Prompt time: user chooses a daily time; default 19:00 local.
  - Reminder policy: single daily reminder; allow "snooze 30 minutes".
- Permission: request on first app open with explanation of value (3–5 sentences).
- Handling timezone: use local device timezone; schedule using local date/time.

---

## 2.0 Analytics & Instrumentation

Instrument events (example names):

- `session_record_start`, `session_record_stop` (include sectionId, dayNumber, durationSec)
- `playback_start`, `playback_stop`
- `srs_card_reviewed` (result: again/good/easy)
- `notification_opt_in`, `notification_dismissed`
- `recording_deleted`, `recording_retained`
- `srs_imported`

Include properties: userDeviceLocale, appVersion, dayNumber, sectionId.

Privacy: audio file paths must never be uploaded in V2. Analytics should not include raw audio or transcriptions.

---

## 2.0 Acceptance Criteria (developer-ready)

- [ ] Recording UI enabled and permission flow implemented.
- [ ] Recording files saved to app document directory with naming convention.
- [ ] Playback control (play/pause/seek) for the last recording per section.
- [ ] SRS persists card state locally and selects due cards based on Leitner intervals.
- [ ] Import Days 1–90 JSON (V2 enable) and verify Day 1..90 loads correctly.
- [ ] Notifications scheduling works and is configurable by user.
- [ ] Retention policy applied — recordings older than 30 days purged by scheduled maintenance job.
- [ ] Analytics events emitted for all key actions.
- [ ] Unit tests for SRS logic and storage operations.

---

## 2.0 Developer Tickets (suggested)

- V2-001: Add Recording abstraction + permission flow. (P0)
- V2-002: Persist recordings to FileSystem + list/delete UI. (P0)
- V2-003: Playback component with scrub + waveform (simple). (P1)
- V2-004: Implement SRS (Leitner) engine + persistence. (P0)
- V2-005: Import Days 1–90 JSON + migration script. (P0)
- V2-006: Stats screen (reviews due, accuracy, totalMinutes). (P1)
- V2-007: Local push notifications scheduling UI + opt-in. (P1)
- V2-008: Analytics instrumentation for recording, playback, SRS. (P1)
- V2-009: Retention sweeper job (delete recordings >30 days). (P2)

---

## 2.0 Risks & Mitigations

- **Permission denials**: fallback gracefully; do not block core flows.
- **Storage growth**: enforce per-file size and auto-prune; provide user control.
- **Device compatibility**: test Android fragmentation (Samsung, Xiaomi). Allocate time for audio quirks.
- **SRS tuning**: run a small pilot to tune Leitner intervals.

---

## Version 3.0 — Scale (Week 6–10) — Detailed Spec

### Goals (user-facing)

- Add **Speech-to-Text (STT)** pronunciation scoring and feedback.
- Add **Backend sync** for progress, optional cloud backup of recordings, and premium purchase validation.
- Introduce **Premium** ad-free unlock ($2.99 one-time) and server-side receipt validation.
- Premium cloud audio policy: **premium cloud audio is stored for 90 days to match the 90-day program**.

This version triggers privacy, legal, and ops requirements — I include detailed guidance.

---

## 3.0 Architecture Overview

- **Backend**: Node.js (Express or Fastify) API + Postgres for authoritative data + object store (S3) for recordings (optional, see privacy). Hosted on provider of choice (e.g., AWS, DigitalOcean, Railway).
- **Auth**: lightweight JWT with device-scoped tokens for backup and premium restore. Optionally use Firebase Auth if you want built-in flows.
- **Payments**: in-app purchase via App Store & Play Billing; receipts validated server-side.
- **STT**: evaluate on-device vs cloud. I provide a decision matrix and recommended approach below.

---

## 3.0 STT & Pronunciation Scoring — Options & Recommendation

### Options

1. **On-device STT + scoring**

   - Pros: privacy-friendly, lower recurring costs, works offline.
   - Cons: limited language model quality; device variation; heavier app binary if bundled.
2. **Cloud STT (3rd-party API)**

   - Pros: high-quality models, controllable score outputs.
   - Cons: recurring cost, must transfer audio (PII) → requires explicit consent & GDPR handling.
3. **Hybrid**

   - Use on-device for instant feedback; send short segments to cloud for higher-accuracy scoring optionally when user opts in.

### Recommended (privacy-first, incremental)

- **Hybrid**:

  - Provide *on-device basic scoring* (word match, simple pronunciation signal) for instant UX.
  - Offer **cloud scoring** as an *opt-in* premium enhancement or diagnostic mode (explicit consent, data deletion options).
  - For V3 launch, implement cloud scoring as opt-in and default to on-device simple scoring.

### Scoring model (developer-ready)

- For each sentence:

  - Compute WER (word error rate) via STT transcript vs expected sentence.
  - Compute pronunciation proxy: confidence average across words (if STT gives confidences) or spectral difference metric (simple).
  - Combine into score 0–100:

    - `score = 0.6 * (1 - WER) * 100 + 0.4 * pronunciationConfidence * 100`
  - Provide thresholds:

    - `>= 85` — Excellent
    - `70–85` — Good, minor issues
    - `< 70` — Needs work
- Store per-attempt score local + (if user opted-in) send aggregate to backend.

**Note:** This is a concrete, implementable scoring approach. If you later select a cloud STT with built-in pronunciation scoring, map their score to the same 0–100 scale.

---

## 3.0 Backend API (developer-ready)

### Auth

- `POST /auth/device-register` → returns `deviceToken` (JWT)
- Use device id + random secret to identify devices without user accounts.

### Endpoints (examples)

```http
POST /api/v1/sync/progress
Authorization: Bearer <deviceToken>
Body: { currentDay, streak, sessionsCompleted, totalMinutes, lastCompletedDate }

POST /api/v1/recordings/upload
Form-data: file (m4a), metadata { dayNumber, sectionId, sessionTs }
Response: { url }

GET /api/v1/recordings/list
Query: ?since=2026-02-01

POST /api/v1/purchases/verify
Body: { platform: 'ios'|'android', receipt: '<receipt-payload>' }

GET /api/v1/stt/score
Authorization: Bearer <deviceToken>
Body: { audioFileUrl } OR send base64
Response: { score: 0-100, wordErrors: [], transcript: '', confidences: [] }
```

Security:

- HTTPS only.
- Validate JWTs.
- Rate-limit STT/score endpoints to control cost.

Data retention policy:

- Default: if user opts into cloud backup, keep recordings for 90 days by default (configurable).
- Premium alignment: **premium cloud audio is stored for 90 days to match the 90-day program**.
- Provide delete endpoint: `DELETE /api/v1/recordings/:id` and a GDPR workflow.

---

## 3.0 Data Model Additions (TypeScript)

```ts
interface RecordingMeta {
  id: string;
  deviceId?: string;
  dayNumber: number;
  sectionId: string;
  localPath?: string;
  remoteUrl?: string;
  durationSec: number;
  createdAt: string;
}

interface SttScore {
  id: string;
  recordingId: string;
  score: number;
  transcript: string;
  wordErrors?: Array<{ expected: string; actual: string; index: number }>;
  createdAt: string;
}
```

---

## 3.0 Payments & Monetization

### Purchase flow (iOS & Android)

- Implement in-app purchase with platform SDKs:

  - iOS: StoreKit
  - Android: Google Play Billing
- SDK integration via Expo plugins or custom native modules (EAS builds).
- On successful purchase, send receipt to backend for validation:

  - `POST /api/v1/purchases/verify` with platform & receipt
  - Backend validates with Apple/Google servers and returns an entitlement token stored locally (and backed up).
- Support restore purchases:

  - `POST /api/v1/purchases/restore` or call platform restore flow; validate on server then unlock features.

### Premium behavior

- Unlock ad-free experience and cloud scoring (if premium gating applies).
- Premium cloud audio is stored for 90 days to match the 90-day program.
- One-time price `$2.99` local-currency display via store.
- Offer trial? (Optional — if offered, requires careful implementation)

---

## 3.0 Privacy, Legal, GDPR (Germany-focused)

**Crucial**: V3 increases risk and legal exposure. Required steps:

1. **Privacy Impact Assessment (PIA)** — before enabling cloud uploads/STT:

   - Document purpose, data types, retention periods, transfer locations, processors.
   - Note legal basis: consent for audio upload + scoring.
2. **Explicit Consent UI**:

   - Before any audio leaves device, show a modal: what is uploaded, where, retention, opt-out, and checkbox to accept.
   - Store consent records (timestamp) locally & server-side with deviceId.
3. **Data Subject Rights**:

   - Implement `GET /api/v1/data/export` and `DELETE /api/v1/data` for account/device scope.
4. **Data Minimization**:

   - Only send necessary audio segments; allow sending derived features (MFCCs) instead of raw audio if vendor supports it.
5. **Third-party processors**:

   - If using external STT, ensure data processing agreement (DPA).
6. **Server location**:

   - Prefer EU-hosted backend for EU user base to simplify compliance.
7. **Record retention & deletion**:

   - Default retention 90 days. Allow user to request earlier deletion.

---

## 3.0 Acceptance Criteria (developer-ready)

- [ ] On-device STT basic scoring implemented; score shown in UI after playback/recording.
- [ ] Cloud STT scoring implemented as opt-in; consent flow present and logged.
- [ ] Backend endpoints for sync, upload, STT scoring, and purchase verification are implemented and documented.
- [ ] Purchase flow implemented, validated server-side, supports restore.
- [ ] Cloud backup optional: user can enable/disable; default off.
- [ ] GDPR: consent recorded; delete/export endpoints available; retention policy active.
- [ ] Analytics enhanced for premium conversion funnel and STT scoring usage (opt-in rates).
- [ ] E2E tests for purchase flow + restore.

---

## 3.0 Operational & Cost Considerations

- **STT cost**: cloud STT billed per minute; limit cloud scoring to short segments (sentence-level), rate-limit per device.
- **Storage cost**: S3 for recordings; use lifecycle rules to expire objects after 90 days by default.
- **SLO & Monitoring**: track backend latency, failure rates (STT failures, upload errors), payment failures, and storage growth.
- **Scaling plan**: start with small instance + auto-scaling for STT worker pool.

---

## 3.0 Developer Tickets (suggested)

- V3-001: Design & implement STT on-device scoring module. (P0)
- V3-002: Implement backend prototype for STT scoring + receipt validation. (P0)
- V3-003: Implement user consent modal + DPA checklist. (P0)
- V3-004: Implement cloud recording upload + retention rules (opt-in). (P1)
- V3-005: Integrate in-app purchases + server-side receipt validation + restore. (P0)
- V3-006: Add GDPR endpoints: data export & deletion. (P1)
- V3-007: Add server monitoring + cost alert for STT usage. (P1)

---

## 3.0 KPIs & Experimentation

- Premium conversion rate (goal: 1–3% first cohort)
- Cloud STT opt-in rate
- Average premium LTV (projected)
- D1–D7 retention before vs after scoring feature (A/B test)
- Error rate of STT scoring vs threshold (for quality gating)

---

## 3.0 Risks & Mitigations

- **Privacy/Legal**: High risk if audio is uploaded without proper consent — mitigation: opt-in, PIA, EU hosting, short retention.
- **Costs**: STT + storage can blow budget — mitigation: limit cloud scoring frequency, sentence-level uploads, caching.
- **Fraud/Payments**: Invalid receipts — mitigate with server-side validation + revoke entitlements on failure.
- **Quality**: On-device scoring may feel poor — mitigate with hybrid model and clear messaging.

---

## Cross-Version: Analytics Taxonomy (MVP → V3)

Minimal instrumentation to add now (event name → key props):

- `app_open` → { deviceId, appVersion }
- `session_start` → { dayNumber, sessionId, timestamp }
- `session_complete` → { dayNumber, sessionElapsedSec, sectionsCompleted }
- `ad_interstitial_shown` → { dayNumber, success }
- `record_start` / `record_stop` → { sectionId, durationSec }
- `playback_start` / `playback_stop` → { recordingId }
- `srs_card_reviewed` → { cardId, result }
- `stt_scored` → { recordingId, score, method: 'on-device'|'cloud' }
- `purchase_attempt` / `purchase_success` / `purchase_restore` → { platform, sku }

---

## Migration & Rollout Guidance

- **Feature flags**: gate V2 and V3 features behind remote flags (LaunchDarkly or simple remote config). Roll out to 5% → 25% → 100%.
- **Pilot**: run a 100-user pilot for V2 SRS + recording across common Android devices to baseline storage and compatibility.
- **A/B tests**: V3 scoring on/off to measure retention lift before wide rollout.
- **Telemetry**: monitor device storage usage, app crashes, and STT errors.

---

## Timeline (high-level, assuming team capacity)

- Weeks 3–5 (V2): implement recording/playback, SRS engine, notifications, stats screen, Days 1–90 import. Pilot with 100 users in Week 5.
- Weeks 6–10 (V3): backend skeleton, on-device STT scoring, consent flows, cloud STT opt-in, payments integration, GDPR endpoints, pilot premium customers.

---

## Quick Checklist to make V2/V3 engineering-ready (actionable)

1. Add SRS and Recording tickets to the backlog with acceptance criteria above.
2. Create a small audio spike: record/playback on sample devices (Android low-end + iOS) — 2–3 dev days.
3. Draft PIA and consent text now (legal review) before enabling upload.
4. Add remote config to gate V2 & V3 features.
5. Implement analytics events listed above.
6. Provide server playground (staging) for receipt validation + STT tests.

---
