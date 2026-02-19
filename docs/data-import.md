# Days Data Import Process

Canonical source lives in `speak_data/` (outside git).  
Runtime source is `assets/data/days.json`.

## Source-of-truth rules

- Keep day numbers contiguous starting at `1`.
- Keep the existing section schema for each day:
  - `id`, `type`, `title`, `sentences`, `reps`, `duration`
- Keep source text exact by default (no normalization/rewording).
- Exception for `free` section fallback:
  - If canonical `free.sentences` is the single generic line (`Speak non-stop using today’s verbs...`), generate day-specific free prompts from:
    - `anki` first front text (theme line)
    - `verbs` section sentences (cue lines)

## Import workflow

1. Place extracted day content under `speak_data/` in this repo root.
2. Update `assets/data/days.json` from that canonical source.
3. Validate schema + day sequence:

```bash
npm test -- src/data/day-loader.test.ts --runInBand
./node_modules/.bin/tsc --noEmit --pretty false
```

4. Smoke-test app flows:
  - Home shows latest unlocked day.
  - Session can open for first/last available day.
  - Section progression works unchanged.

## Target progression

- Current imported range: Days `1..90`.
