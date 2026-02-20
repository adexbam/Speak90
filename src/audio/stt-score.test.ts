import { scorePronunciationLocally } from './stt-score';

describe('stt-score', () => {
  it('returns unsupported fallback on web', () => {
    const result = scorePronunciationLocally({
      expectedText: 'Ich beginne jetzt.',
      durationMs: 3000,
      platform: 'web',
    });

    expect(result.supported).toBe(false);
    expect(result.score).toBeNull();
    expect(result.feedback).toBeNull();
  });

  it('returns normalized score in 0..100 with feedback on native platforms', () => {
    const result = scorePronunciationLocally({
      expectedText: 'Ich beginne jetzt.',
      durationMs: 3200,
      platform: 'ios',
    });

    expect(result.supported).toBe(true);
    if (result.supported) {
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(['good', 'needs work']).toContain(result.feedback);
    }
  });
});

