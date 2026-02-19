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

- Displays total minutes spoken or elapsed
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
**Acceptance Criteria**:

- Final list of sections approved
- Total session time defined and consistent

---

### Ticket 11: Define streak + day advancement rules

**Type**: Task  
**Priority**: P0  
**Description**: Define rules for streaks and progression.  
**Acceptance Criteria**:

- Streak reset logic defined (timezone + missed day)
- Rules for unlocking next day defined

---

### Ticket 12: Define session time metric

**Type**: Task  
**Priority**: P1  
**Description**: Specify whether “totalMinutes” is elapsed time or spoken time.  
**Acceptance Criteria**:

- Metric definition documented and used in UI

---

### Ticket 13: Confirm Anki card data source

**Type**: Task  
**Priority**: P1  
**Description**: Decide whether Anki cards are hardcoded or embedded in Days JSON.  
**Acceptance Criteria**:

- Data source specified
- Example data provided

---

### Ticket 14: Clarify ad rules

**Type**: Task  
**Priority**: P1  
**Description**: Define interstitial timing/skip rules and behavior on abort.  
**Acceptance Criteria**:

- Interstitial display rules documented
- Abort handling documented

---

### Ticket 15: Permissions policy

**Type**: Task  
**Priority**: P2  
**Description**: Decide whether microphone permission is required for MVP.  
**Acceptance Criteria**:

- Store permission list matches actual app behavior
- If no recording in MVP, microphone permission removed
