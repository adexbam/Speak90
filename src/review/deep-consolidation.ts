import type { Day } from '../data/day-model';

export type DeepVerbTarget = {
  label: '1-30' | '31-60' | '61-90';
  verbs: string[];
};

function normalizeVerb(sentence: string): string {
  return sentence.trim();
}

function collectVerbs(days: Day[]): string[] {
  const pool: string[] = [];
  for (const day of days) {
    for (const section of day.sections) {
      if (section.type !== 'verbs') {
        continue;
      }
      for (const sentence of section.sentences) {
        const verb = normalizeVerb(sentence);
        if (verb.length > 0) {
          pool.push(verb);
        }
      }
    }
  }
  return [...new Set(pool)];
}

export function buildDeepConsolidationVerbTargets(days: Day[]): DeepVerbTarget[] {
  const ranges: Array<{ label: DeepVerbTarget['label']; from: number; to: number }> = [
    { label: '1-30', from: 1, to: 30 },
    { label: '31-60', from: 31, to: 60 },
    { label: '61-90', from: 61, to: 90 },
  ];

  return ranges.map((range) => {
    const rangeDays = days.filter((day) => day.dayNumber >= range.from && day.dayNumber <= range.to);
    return {
      label: range.label,
      verbs: collectVerbs(rangeDays).slice(0, 5),
    };
  });
}
