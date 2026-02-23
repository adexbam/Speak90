import type { Day } from '../data/day-model';
import { buildDeepConsolidationVerbTargets } from './deep-consolidation';

function makeDay(dayNumber: number, verbs: string[]): Day {
  return {
    dayNumber,
    sections: [
      {
        id: 'verbs-a',
        type: 'verbs',
        title: 'Verbs',
        sentences: verbs,
        reps: 10,
        duration: 180,
      },
    ],
  };
}

describe('deep-consolidation', () => {
  it('builds verb targets for 1-30, 31-60, 61-90 ranges', () => {
    const days: Day[] = [
      makeDay(1, ['Ich sehe.', 'Ich spreche.']),
      makeDay(35, ['Ich lerne.', 'Ich arbeite.']),
      makeDay(70, ['Ich fahre.', 'Ich koche.']),
    ];

    const targets = buildDeepConsolidationVerbTargets(days);
    expect(targets[0]?.label).toBe('1-30');
    expect(targets[0]?.verbs).toContain('Ich sehe.');
    expect(targets[1]?.label).toBe('31-60');
    expect(targets[1]?.verbs).toContain('Ich lerne.');
    expect(targets[2]?.label).toBe('61-90');
    expect(targets[2]?.verbs).toContain('Ich fahre.');
  });
});
