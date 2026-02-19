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
app.json Configuration

{
  "plugins": [
    ["react-native-google-mobile-ads", {
      "androidAppId": "ca-app-pub-TEST~TEST",
      "iosAppId": "ca-app-pub-TEST~TEST"
    }]
  ]
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
| App Store  | $99/year     | 1-3 days    | None for MVP |
| Play Store | $25 once     | 24-72h      | None for MVP |

### Permissions Policy (Ticket 15 - Feb 19, 2026)

- MVP does **not** request microphone access
- `app.json` must not include `NSMicrophoneUsageDescription` (iOS) or `RECORD_AUDIO` permission (Android) for MVP
- Microphone permission is introduced only when recording features ship (planned for V2)

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
