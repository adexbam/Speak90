import { buildDaySpecificFreeSentences, isGenericFreePrompt } from './free-prompt-generator';

describe('free-prompt-generator', () => {
  it('detects canonical generic free prompt block', () => {
    expect(isGenericFreePrompt(['Speak non-stop using today’s verbs. Do not stop. Do not correct yourself.'])).toBe(true);
    expect(isGenericFreePrompt(['Speak non-stop using today’s verbs.'])).toBe(false);
    expect(isGenericFreePrompt(['A', 'B'])).toBe(false);
  });

  it('builds day-specific free sentences from verbs and anki', () => {
    const lines = buildDaySpecificFreeSentences(
      31,
      ['Ich beginne.', 'Ich lerne.', 'Ich arbeite.', 'Ich denke nach.', 'Ich spreche.'],
      ['I start now. -> Ich beginne jetzt.'],
    );

    expect(lines[0]).toBe('Speak non-stop about this Day 31 theme: I start now.');
    expect(lines[1]).toBe('Do not stop. Do not correct yourself.');
    expect(lines[2]).toBe('Ich beginne…');
    expect(lines[6]).toBe('Ich spreche…');
    expect(lines[7]).toBe('Mal sehen.');
  });
});
