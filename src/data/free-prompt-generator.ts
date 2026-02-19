const GENERIC_FREE_PROMPT = 'Speak non-stop using today’s verbs. Do not stop. Do not correct yourself.';

function trimSentenceEnd(value: string): string {
  return value.trim().replace(/[.!?]+$/g, '');
}

function extractAnkiFront(ankiSentence: string): string {
  const [front] = ankiSentence.split('->');
  return trimSentenceEnd(front ?? '');
}

function toGermanCue(verbSentence: string): string {
  const rightSide = verbSentence.includes('->') ? verbSentence.split('->').pop() ?? '' : verbSentence;
  const cleaned = trimSentenceEnd(rightSide).replace(/\s+/g, ' ');
  return cleaned.length > 0 ? `${cleaned}…` : '';
}

export function isGenericFreePrompt(freeSentences: string[]): boolean {
  return freeSentences.length === 1 && freeSentences[0] === GENERIC_FREE_PROMPT;
}

export function buildDaySpecificFreeSentences(dayNumber: number, verbs: string[], anki: string[]): string[] {
  const theme = extractAnkiFront(anki[0] ?? '');
  const cues = verbs.map(toGermanCue).filter((cue) => cue.length > 0).slice(0, 5);
  const prompt = theme
    ? `Speak non-stop about this Day ${dayNumber} theme: ${theme}.`
    : `Speak non-stop using Day ${dayNumber} verbs.`;

  return [prompt, 'Do not stop. Do not correct yourself.', ...cues, 'Mal sehen.'];
}
