# Information Architecture

Navigation (MVP):

Home (default)

Session (modal/fullscreen flow)

Session Complete (modal)

Future (v2/v3):

Add bottom tabs: Home | Stats | Review | Settings

Keep Session as a fullscreen stack route (always consistent)

Design System (MVP)

Theme

Background: #1a1a1a

Text: #ffffff

Muted text: rgba(255,255,255,0.7)

Accent (confirm/next): #10b981

Record: #ef4444

Border: rgba(255,255,255,0.12)

Surface: #222222 (cards)

Type Scale

Screen title: 24 / bold

Sentence: 20 / regular

Timer: 48 / bold

Supporting labels: 14–16

Layout Rules

8pt spacing grid (8/16/24/32)

Primary CTA is always bottom pinned

One primary action per screen

Key Screens (Wireframe-level)

1) Home Screen

Primary goal: start today’s session in one tap, show streak/progress, keep it lightweight.

Top section

Speak90 (title)

Small subtitle: Day 4 • A1-B1 Speaking Routine

Progress card

Big: Day 4

Streak: 3 🔥

Avg: 42 min

Small: Last session: Yesterday

Primary CTA

Large button: START SESSION

Secondary (small): Preview today’s drills

Banner Ad

Fixed at bottom with safe area padding

Nice-to-have (still MVP-friendly)

“Days 1–10” list collapsed (optional): tap to open day picker

But default should be Today only to avoid decision fatigue

1) Session Runner (Fullscreen)

This is the heart. Keep it extremely legible.

Header

Left: X (exit)

Center: Warm-up (section title)

Right: Day 4

Section info row

Warm-up (5 min) • 4 sentences • x5 reps

Small progress: 2/4 sentences

Main content

The sentence (very large, center):

Ich weiß nicht.

Optional: small helper line (future): “tap for translation” (disabled in MVP)

Timer

Big countdown: 00:28

Label: Remaining

Controls

Primary action: giant ✓ Next button (you called out 120pt; do it)

Secondary: Restart timer (small text button)

Optional: “Auto-advance” toggle (default off for MVP)

Interaction model (MVP-simple)

Each section is a timed block.

User presses ✓ to advance sentence/cards.

Timer runs for section duration (or per sentence if you want more structure later).

At end of section, auto moves to next section with a short transition.

1) Patterns Section (EN → DE flashcards)

Header same

Title: Patterns

Progress: 3/10

Card

Big EN prompt: I want to see that.

Tap to reveal DE (or show DE immediately but visually separated):

Ich will das sehen.

Action

✓ I said it (primary)

Repeat (secondary)

This keeps “speak aloud → ✓” as the core behavior.

1) Anki Review (hardcoded 10 cards)

Card

Top: “Review”

Center: German sentence or word

Bottom buttons (3):

Again (left)

Good (center)

Easy (right)

UX detail

Buttons should be equal width, large touch targets.

On tap, animate card sliding away (simple, feels polished).

1) Free Output (5 min)

Prompt

Title: Free Output

Prompt card:

Heute...

Talk about: your day, your work, what you’ll do tomorrow

Timer

Big countdown

Buttons:

Primary: Finish Session (enabled anytime)

Secondary: +1 min (optional, but can boost engagement)

1) Session Complete (Interstitial moment)

Celebration

Session Complete!

44 minutes spoken

Streak: 4 🔥

Day 4 saved

CTA

Back to Home

Ad rule

Show AdMob interstitial after user taps “Back to Home” OR after a 1–2s delay on this screen.

Don’t block the “success moment” immediately; it hurts retention.

State Model (UI/UX-friendly)

UserProgress on Home

currentDay

streak

sessionsCompleted

totalMinutes

lastCompletedAt (even if you don’t store it in MVP, it helps streak correctness)

Session runtime state (Zustand)

dayNumber

sectionIndex

itemIndex (sentence/card index)

timeRemaining

isPaused

sessionStartTs

spokenSeconds (approx: just track active seconds)

UX Edge Cases (MVP must-have)

Exit mid-session

Confirm modal: “End session? Progress won’t count toward streak.”

Options: Resume / End session

App backgrounded

Pause timer automatically

On resume: “Continue?” (1-tap)

Timer hits 0

Soft haptic + toast: “Section time complete”

Auto-advance to next section after 1s, unless user is mid-interaction (then show “Continue”)

Day JSON missing

Friendly fallback: “Day data not found. Reinstall or update.”

(Engineering: this should never happen, but don’t crash)

Component Breakdown (Engineering-ready)

HomeScreen

ProgressCard

StartButton

BannerAdSlot

SessionScreen

SessionHeader

SectionMeta

PromptCard (sentence/flashcard)

CountdownTimer

PrimaryActionBar (✓ Next)

SessionCompleteModal

useSessionStore (Zustand)

progressStorage (AsyncStorage wrapper)

daysRepository (loads JSON, returns Day config)

This structure scales cleanly when you add recording, SRS, stats, and backend sync.

UI Polish That’s Cheap but High Impact

Subtle animations:

Card fade/slide on next

Progress bar fill

Haptics on:

✓ Next

Timer completion

Keep everything “one-handed”:

Primary button always bottom
