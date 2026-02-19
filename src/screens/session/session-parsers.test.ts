import { parseBilingualPair } from './session-parsers';

describe('parseBilingualPair', () => {
  it('parses normal EN -> DE pair', () => {
    expect(parseBilingualPair('I start now -> Ich beginne jetzt.')).toEqual({
      front: 'I start now',
      back: 'Ich beginne jetzt.',
    });
  });

  it('falls back to same text when separator is missing', () => {
    expect(parseBilingualPair('Ich beginne jetzt.')).toEqual({
      front: 'Ich beginne jetzt.',
      back: 'Ich beginne jetzt.',
    });
  });

  it('handles malformed left/right sides safely', () => {
    expect(parseBilingualPair(' -> Hallo')).toEqual({ front: 'Hallo', back: 'Hallo' });
    expect(parseBilingualPair('Hello -> ')).toEqual({ front: 'Hello', back: 'Hello' });
  });
});
