import type { SessionSectionType } from '../../data/day-model';

export const sectionHints: Record<SessionSectionType, string> = {
  warmup: 'Repeat each line aloud with rhythm and confidence.',
  verbs: 'Speak each verb form clearly and keep a steady pace.',
  sentences: 'Say each sentence naturally and fully.',
  modals: 'Focus on modal clarity and sentence order.',
  patterns: 'EN to DE flashcard flow: speak first, then reveal/check.',
  anki: 'Grade each card: Again, Good, or Easy.',
  free: 'Speak non-stop until timer ends using the prompt and cues.',
};

export const nextSectionExpectations: Record<SessionSectionType, string> = {
  warmup: 'You will repeat short anchor phrases in a loop.',
  verbs: 'You will cycle through core verb forms over multiple rounds.',
  sentences: 'You will practice full example sentences over multiple rounds.',
  modals: 'You will drill modal constructions over multiple rounds.',
  patterns: 'You will do EN -> DE reveal-and-complete pattern cards.',
  anki: 'You will review cards and grade each one: Again, Good, or Easy.',
  free: 'You will speak continuously from prompts until timer ends.',
};
