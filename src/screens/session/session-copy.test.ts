import { nextSectionExpectations, sectionHints } from './session-copy';

const sectionTypes = ['warmup', 'verbs', 'sentences', 'modals', 'patterns', 'anki', 'free'] as const;

describe('session-copy', () => {
  it('provides hint text for all section types', () => {
    for (const type of sectionTypes) {
      expect(sectionHints[type]).toBeTruthy();
      expect(sectionHints[type].length).toBeGreaterThan(5);
    }
  });

  it('provides transition expectation text for all section types', () => {
    for (const type of sectionTypes) {
      expect(nextSectionExpectations[type]).toBeTruthy();
      expect(nextSectionExpectations[type].length).toBeGreaterThan(5);
    }
  });
});
