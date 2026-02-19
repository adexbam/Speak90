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
|---------|----------|----------|----------------|
| **Home** | - | "Day X • Streak: N 🔥" → **START SESSION** | Days 1-10 JSON |
| **1. Warm-up** | 5min | 4 sentences × 5 reps | Timer + ✓ button |
| **2A. Core Verbs** | 3min | 5 verbs × 10 reps | "Ich sehe." etc. |
| **2B. Sentences** | 4min | 5 sentences × 5 reps | "Ich sehe das." |
| **2C. Modals** | 3min | 5 sentences × 3 reps | "Ich will das sehen." |
| **3. Patterns** | 10min | EN→DE flashcards | Speak aloud → ✓ |
| **4. Anki Review** | 10min | 10 hardcoded cards | Again/Good/Easy |
| **5. Free Output** | 5min | Timer + "Heute..." prompt | End session |

**Progress**: Local storage (streak, days completed)
**Ads**: Interstitial after session + Home banner

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

5. USER FLOWS
1. Home → "Day 4 -  Streak: 3 🔥 -  42min avg" [START SESSION]
2. Warm-up → "Ich weiß nicht." [Repeat 5x] [00:28] [✓ Next]
3. Auto/manual advance through 5 sections  
4. "Session Complete! 44min spoken" → **AdMob Interstitial (5s)**
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
| App Store  | $99/year     | 1-3 days    | Microphone   |
| Play Store | $25 once     | 24-72h      | RECORD_AUDIO |

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
- 80% complete all 5 sections


11. APPROVALS
Product Manager: ✅ APPROVED Feb 19, 2026
Engineering Lead: ____________________

IMMEDIATE NEXT STEPS:

Create Days 1-10 JSON today

Build SessionRunner component by Feb 21

Test 1 full session on Expo Go by Feb 22
