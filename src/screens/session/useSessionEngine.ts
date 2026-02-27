import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SessionSection } from '../../data/day-model';
import {
  buildSectionTransition,
  clampIndex,
  isRepEnforcedSection,
  resolveDraftIndices,
  type SectionTransition,
} from './session-engine.logic';

export type { SectionTransition };

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

      const { safeSectionIndex, safeSentenceIndex } = resolveDraftIndices({
        sections,
        draftSectionIndex: draft.sectionIndex,
        draftSentenceIndex: draft.sentenceIndex,
      });

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

    const transition = buildSectionTransition({
      section,
      sectionIndex,
      sections,
    });
    if (!transition) {
      setSectionIndex(sections.length);
      return;
    }

    setSectionTransition(transition);
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
      // Pattern drill loops for full section duration; timer end or explicit
      // "I'm confident - Next Section" moves forward.
      setSentenceIndex(0);
      return;
    }

    setSentenceIndex((prev) => prev + 1);
  }, [section, sentenceIndex]);

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
