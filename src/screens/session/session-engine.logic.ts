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
