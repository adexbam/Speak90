import type { SessionSection, SessionSectionType } from '../../data/day-model';

export type SectionTransition = {
  completedTitle: string;
  nextSectionIndex: number;
  nextTitle: string;
  nextType: SessionSectionType;
};

export function isRepEnforcedSection(type: SessionSectionType): boolean {
  return type === 'warmup' || type === 'verbs' || type === 'sentences' || type === 'modals';
}

export function clampIndex(index: number, max: number): number {
  if (!Number.isInteger(index)) {
    return 0;
  }
  return Math.min(Math.max(index, 0), max);
}

export function buildSectionTransition(params: {
  section: SessionSection;
  sectionIndex: number;
  sections: SessionSection[];
}): SectionTransition | null {
  const isLastSection = params.sectionIndex >= params.sections.length - 1;
  if (isLastSection) {
    return null;
  }

  const nextSectionIndex = params.sectionIndex + 1;
  const nextSection = params.sections[nextSectionIndex];
  return {
    completedTitle: params.section.title,
    nextSectionIndex,
    nextTitle: nextSection.title,
    nextType: nextSection.type,
  };
}

export function resolveDraftIndices(params: {
  sections: SessionSection[];
  draftSectionIndex: number;
  draftSentenceIndex: number;
}): { safeSectionIndex: number; safeSentenceIndex: number } {
  const safeSectionIndex = clampIndex(params.draftSectionIndex, Math.max(0, params.sections.length - 1));
  const safeSection = params.sections[safeSectionIndex];
  const safeSentenceIndex = clampIndex(params.draftSentenceIndex, Math.max(0, safeSection.sentences.length - 1));

  return {
    safeSectionIndex,
    safeSentenceIndex,
  };
}

export function resolveAdvanceSentenceState(params: {
  section: SessionSection;
  sentenceIndex: number;
  repRound: number;
  isRepEnforced: boolean;
  isWarmupSection: boolean;
  sectionIndex: number;
  sectionsLength: number;
}):
  | { kind: 'next-sentence' }
  | { kind: 'next-round' }
  | { kind: 'warmup-loop' }
  | { kind: 'next-section-transition' }
  | { kind: 'complete' }
  | { kind: 'move-to-next-section' } {
  if (params.isRepEnforced) {
    const isLastSentenceInRound = params.sentenceIndex >= params.section.sentences.length - 1;
    if (!isLastSentenceInRound) {
      return { kind: 'next-sentence' };
    }

    if (params.repRound < params.section.reps) {
      return { kind: 'next-round' };
    }

    if (params.isWarmupSection) {
      return { kind: 'warmup-loop' };
    }

    return { kind: 'next-section-transition' };
  }

  const isLastSentence = params.sentenceIndex >= params.section.sentences.length - 1;
  if (!isLastSentence) {
    return { kind: 'next-sentence' };
  }

  const isLastSection = params.sectionIndex >= params.sectionsLength - 1;
  if (isLastSection) {
    return { kind: 'complete' };
  }

  return { kind: 'move-to-next-section' };
}

export function resolveAdvancePatternState(params: {
  section: SessionSection;
  sentenceIndex: number;
}): 'loop' | 'next-sentence' {
  const isLastSentence = params.sentenceIndex >= params.section.sentences.length - 1;
  if (isLastSentence) {
    return 'loop';
  }
  return 'next-sentence';
}
