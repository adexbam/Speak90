import React from 'react';
import { act, create } from 'react-test-renderer';
import type { SessionSection } from '../../data/day-model';
import { useSessionEngine } from './useSessionEngine';

type EngineSnapshot = ReturnType<typeof useSessionEngine>;

let latestEngine: EngineSnapshot | null = null;

function EngineHarness({ sections }: { sections: SessionSection[] }) {
  latestEngine = useSessionEngine(sections);
  return null;
}

function getEngine(): EngineSnapshot {
  if (!latestEngine) {
    throw new Error('Engine is not initialized.');
  }
  return latestEngine;
}

function advance(times = 1) {
  for (let i = 0; i < times; i += 1) {
    act(() => {
      getEngine().advanceSentenceOrSection();
    });
  }
}

const sectionsFixture: SessionSection[] = [
  {
    id: 'warmup-a',
    type: 'warmup',
    title: 'Warm-up',
    sentences: ['A', 'B'],
    reps: 2,
    duration: 60,
  },
  {
    id: 'verbs-a',
    type: 'verbs',
    title: 'Core Verbs',
    sentences: ['V1', 'V2'],
    reps: 2,
    duration: 120,
  },
];

describe('useSessionEngine', () => {
  beforeEach(() => {
    latestEngine = null;
  });

  it('progresses sentence and rounds within rep-enforced sections', () => {
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<EngineHarness sections={sectionsFixture} />);
    });

    expect(getEngine().sectionIndex).toBe(0);
    expect(getEngine().sentenceIndex).toBe(0);
    expect(getEngine().repRound).toBe(1);

    act(() => {
      getEngine().advanceSentenceOrSection();
    });
    expect(getEngine().sentenceIndex).toBe(1);
    expect(getEngine().repRound).toBe(1);

    act(() => {
      getEngine().advanceSentenceOrSection();
    });
    expect(getEngine().sentenceIndex).toBe(0);
    expect(getEngine().repRound).toBe(2);

    act(() => {
      renderer.unmount();
    });
  });

  it('keeps looping warmup after last sentence of final round', () => {
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<EngineHarness sections={sectionsFixture} />);
    });

    advance(); // s1 r1
    advance(); // s0 r2
    advance(); // s1 r2
    advance(); // warmup loop reset

    expect(getEngine().sectionIndex).toBe(0);
    expect(getEngine().sentenceIndex).toBe(0);
    expect(getEngine().repRound).toBe(1);
    expect(getEngine().sectionTransition).toBeNull();

    act(() => {
      renderer.unmount();
    });
  });

  it('creates section transition after non-warmup reps complete and continues on confirm', () => {
    const onlyVerbs: SessionSection[] = [
      { ...sectionsFixture[1], id: 'verbs-a' },
      { ...sectionsFixture[1], id: 'verbs-b' },
    ];
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<EngineHarness sections={onlyVerbs} />);
    });

    advance(); // s1 r1
    advance(); // s0 r2
    advance(); // s1 r2
    advance(); // transition

    expect(getEngine().sectionTransition).not.toBeNull();
    expect(getEngine().sectionTransition?.nextSectionIndex).toBe(1);
    expect(getEngine().sectionIndex).toBe(0);

    act(() => {
      getEngine().continueFromTransition();
    });

    expect(getEngine().sectionTransition).toBeNull();
    expect(getEngine().sectionIndex).toBe(1);
    expect(getEngine().sentenceIndex).toBe(0);
    expect(getEngine().repRound).toBe(1);

    act(() => {
      renderer.unmount();
    });
  });
});
