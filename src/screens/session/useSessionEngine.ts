import { useCallback, useEffect, useMemo, useReducer } from 'react';
import type { SessionSection } from '../../data/day-model';
import {
  buildSectionTransition,
  clampIndex,
  isRepEnforcedSection,
  resolveAdvancePatternState,
  resolveAdvanceSentenceState,
  resolveDraftIndices,
  type SectionTransition,
} from './session-engine.logic';

export type { SectionTransition };

type EngineState = {
  sectionIndex: number;
  sentenceIndex: number;
  repRound: number;
  sectionTransition: SectionTransition | null;
};

type EngineAction =
  | { type: 'RESET_FOR_SECTIONS' }
  | { type: 'MOVE_TO_SECTION'; index: number }
  | { type: 'RESTORE_DRAFT'; sectionIndex: number; sentenceIndex: number; repRound: number }
  | { type: 'SET_SECTION_TRANSITION'; value: SectionTransition | null }
  | { type: 'NEXT_SENTENCE' }
  | { type: 'NEXT_ROUND' }
  | { type: 'LOOP_WARMUP' }
  | { type: 'LOOP_PATTERN' }
  | { type: 'COMPLETE'; completeIndex: number };

function engineReducer(state: EngineState, action: EngineAction): EngineState {
  switch (action.type) {
    case 'RESET_FOR_SECTIONS':
      return {
        sectionIndex: 0,
        sentenceIndex: 0,
        repRound: 1,
        sectionTransition: null,
      };
    case 'MOVE_TO_SECTION':
      return {
        ...state,
        sectionIndex: action.index,
        sentenceIndex: 0,
        repRound: 1,
      };
    case 'RESTORE_DRAFT':
      return {
        ...state,
        sectionIndex: action.sectionIndex,
        sentenceIndex: action.sentenceIndex,
        repRound: action.repRound,
        sectionTransition: null,
      };
    case 'SET_SECTION_TRANSITION':
      return {
        ...state,
        sectionTransition: action.value,
      };
    case 'NEXT_SENTENCE':
      return {
        ...state,
        sentenceIndex: state.sentenceIndex + 1,
      };
    case 'NEXT_ROUND':
      return {
        ...state,
        sentenceIndex: 0,
        repRound: state.repRound + 1,
      };
    case 'LOOP_WARMUP':
      return {
        ...state,
        sentenceIndex: 0,
        repRound: 1,
      };
    case 'LOOP_PATTERN':
      return {
        ...state,
        sentenceIndex: 0,
      };
    case 'COMPLETE':
      return {
        ...state,
        sectionIndex: action.completeIndex,
      };
    default:
      return state;
  }
}

export function useSessionEngine(sections: SessionSection[]) {
  const [state, dispatch] = useReducer(engineReducer, {
    sectionIndex: 0,
    sentenceIndex: 0,
    repRound: 1,
    sectionTransition: null,
  });
  const { sectionIndex, sentenceIndex, repRound, sectionTransition } = state;

  useEffect(() => {
    dispatch({ type: 'RESET_FOR_SECTIONS' });
  }, [sections]);

  const section = sections[sectionIndex];
  const sentence = section?.sentences?.[sentenceIndex] ?? '';
  const isComplete = sectionIndex >= sections.length;
  const isWarmupSection = section?.type === 'warmup';
  const isRepEnforced = !!section && isRepEnforcedSection(section.type);

  const moveToSection = useCallback(
    (index: number) => {
      if (sections.length === 0) {
        dispatch({ type: 'MOVE_TO_SECTION', index: 0 });
        return;
      }
      const clamped = clampIndex(index, sections.length);
      dispatch({ type: 'MOVE_TO_SECTION', index: clamped });
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

      dispatch({
        type: 'RESTORE_DRAFT',
        sectionIndex: safeSectionIndex,
        sentenceIndex: safeSentenceIndex,
        repRound: draft.repRound && draft.repRound > 0 ? draft.repRound : 1,
      });
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
      dispatch({ type: 'COMPLETE', completeIndex: sections.length });
      return;
    }

    dispatch({ type: 'SET_SECTION_TRANSITION', value: transition });
  }, [section, sectionIndex, sections]);

  const continueFromTransition = useCallback(() => {
    if (!sectionTransition) {
      return;
    }
    moveToSection(sectionTransition.nextSectionIndex);
    dispatch({ type: 'SET_SECTION_TRANSITION', value: null });
  }, [moveToSection, sectionTransition]);

  const advanceSentenceOrSection = useCallback(() => {
    if (!section) {
      return;
    }

    const decision = resolveAdvanceSentenceState({
      section,
      sentenceIndex,
      repRound,
      isRepEnforced,
      isWarmupSection,
      sectionIndex,
      sectionsLength: sections.length,
    });

    if (decision.kind === 'next-sentence') {
      dispatch({ type: 'NEXT_SENTENCE' });
      return;
    }

    if (decision.kind === 'next-round') {
      dispatch({ type: 'NEXT_ROUND' });
      return;
    }

    if (decision.kind === 'warmup-loop') {
      dispatch({ type: 'LOOP_WARMUP' });
      return;
    }

    if (decision.kind === 'next-section-transition') {
      advanceToNextSection();
      return;
    }

    if (decision.kind === 'complete') {
      dispatch({ type: 'COMPLETE', completeIndex: sections.length });
      return;
    }

    if (decision.kind === 'move-to-next-section') {
      moveToSection(sectionIndex + 1);
      return;
    }

  }, [advanceToNextSection, isRepEnforced, isWarmupSection, moveToSection, repRound, section, sectionIndex, sections.length, sentenceIndex]);

  const advancePatternCard = useCallback(() => {
    if (!section) {
      return;
    }

    const next = resolveAdvancePatternState({
      section,
      sentenceIndex,
    });
    if (next === 'loop') {
      // Pattern drill loops for full section duration; timer end or explicit
      // "I'm confident - Next Section" moves forward.
      dispatch({ type: 'LOOP_PATTERN' });
      return;
    }

    dispatch({ type: 'NEXT_SENTENCE' });
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
