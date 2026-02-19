import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SessionSection, SessionSectionType } from '../../data/day-model';

export type SectionTransition = {
  completedTitle: string;
  nextSectionIndex: number;
  nextTitle: string;
  nextType: SessionSectionType;
};

function isRepEnforcedSection(type: SessionSectionType): boolean {
  return type === 'warmup' || type === 'verbs' || type === 'sentences' || type === 'modals';
}

function clampIndex(index: number, max: number): number {
  if (!Number.isInteger(index)) {
    return 0;
  }
  return Math.min(Math.max(index, 0), max);
}

export function useSessionEngine(sections: SessionSection[]) {
  const [sectionIndex, setSectionIndex] = useState(0);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [repRound, setRepRound] = useState(1);
  const [sectionTransition, setSectionTransition] = useState<SectionTransition | null>(null);

  useEffect(() => {
    setSectionIndex(0);
    setSentenceIndex(0);
    setRepRound(1);
    setSectionTransition(null);
  }, [sections]);

  const section = sections[sectionIndex];
  const sentence = section?.sentences?.[sentenceIndex] ?? '';
  const isComplete = sectionIndex >= sections.length;
  const isWarmupSection = section?.type === 'warmup';
  const isRepEnforced = !!section && isRepEnforcedSection(section.type);

  const moveToSection = useCallback(
    (index: number) => {
      if (sections.length === 0) {
        setSectionIndex(0);
        return;
      }
      const clamped = clampIndex(index, sections.length);
      setSectionIndex(clamped);
      setSentenceIndex(0);
      setRepRound(1);
    },
    [sections.length],
  );

  const restoreFromDraft = useCallback(
    (draft: { sectionIndex: number; sentenceIndex: number; repRound?: number }) => {
      if (sections.length === 0) {
        return;
      }

      const safeSectionIndex = clampIndex(draft.sectionIndex, Math.max(0, sections.length - 1));
      const safeSection = sections[safeSectionIndex];
      const safeSentenceIndex = clampIndex(draft.sentenceIndex, Math.max(0, safeSection.sentences.length - 1));

      setSectionIndex(safeSectionIndex);
      setSentenceIndex(safeSentenceIndex);
      setRepRound(draft.repRound && draft.repRound > 0 ? draft.repRound : 1);
      setSectionTransition(null);
    },
    [sections],
  );

  const advanceToNextSection = useCallback(() => {
    if (!section) {
      return;
    }

    const isLastSection = sectionIndex >= sections.length - 1;
    if (isLastSection) {
      setSectionIndex(sections.length);
      return;
    }

    const nextSectionIndex = sectionIndex + 1;
    const nextSection = sections[nextSectionIndex];
    setSectionTransition({
      completedTitle: section.title,
      nextSectionIndex,
      nextTitle: nextSection.title,
      nextType: nextSection.type,
    });
  }, [section, sectionIndex, sections]);

  const continueFromTransition = useCallback(() => {
    if (!sectionTransition) {
      return;
    }
    moveToSection(sectionTransition.nextSectionIndex);
    setSectionTransition(null);
  }, [moveToSection, sectionTransition]);

  const advanceSentenceOrSection = useCallback(() => {
    if (!section) {
      return;
    }

    if (isRepEnforced) {
      const isLastSentenceInRound = sentenceIndex >= section.sentences.length - 1;
      if (!isLastSentenceInRound) {
        setSentenceIndex((prev) => prev + 1);
        return;
      }

      if (repRound < section.reps) {
        setSentenceIndex(0);
        setRepRound((prev) => prev + 1);
        return;
      }

      if (isWarmupSection) {
        setSentenceIndex(0);
        setRepRound(1);
        return;
      }

      advanceToNextSection();
      return;
    }

    const isLastSentence = sentenceIndex >= section.sentences.length - 1;
    if (!isLastSentence) {
      setSentenceIndex((prev) => prev + 1);
      return;
    }

    const isLastSection = sectionIndex >= sections.length - 1;
    if (isLastSection) {
      setSectionIndex(sections.length);
      return;
    }

    moveToSection(sectionIndex + 1);
  }, [advanceToNextSection, isRepEnforced, isWarmupSection, moveToSection, repRound, section, sectionIndex, sections.length, sentenceIndex]);

  const advancePatternCard = useCallback(() => {
    if (!section) {
      return;
    }

    const isLastSentence = sentenceIndex >= section.sentences.length - 1;
    if (isLastSentence) {
      moveToSection(sectionIndex + 1);
      return;
    }

    setSentenceIndex((prev) => prev + 1);
  }, [moveToSection, section, sectionIndex, sentenceIndex]);

  return useMemo(
    () => ({
      sectionIndex,
      sentenceIndex,
      repRound,
      sectionTransition,
      section,
      sentence,
      isComplete,
      isWarmupSection,
      isRepEnforced,
      moveToSection,
      restoreFromDraft,
      advanceToNextSection,
      continueFromTransition,
      advanceSentenceOrSection,
      advancePatternCard,
    }),
    [
      sectionIndex,
      sentenceIndex,
      repRound,
      sectionTransition,
      section,
      sentence,
      isComplete,
      isWarmupSection,
      isRepEnforced,
      moveToSection,
      restoreFromDraft,
      advanceToNextSection,
      continueFromTransition,
      advanceSentenceOrSection,
      advancePatternCard,
    ],
  );
}
