import { useCallback } from 'react';
import type { Day, SessionSection } from '../../data/day-model';
import { reviewSrsCard } from '../../data/srs-store';

type UseSessionLearningActionsParams = {
  day?: Day;
  section?: SessionSection;
  sentence: string;
  sentenceIndex: number;
  markPatternCompleted: (sentenceIndex: number) => void;
  advancePatternCard: () => void;
  advanceSentenceOrSection: () => void;
};

export function useSessionLearningActions({
  day,
  section,
  sentence,
  sentenceIndex,
  markPatternCompleted,
  advancePatternCard,
  advanceSentenceOrSection,
}: UseSessionLearningActionsParams) {
  const handleMarkPatternComplete = useCallback(() => {
    markPatternCompleted(sentenceIndex);
    advancePatternCard();
  }, [advancePatternCard, markPatternCompleted, sentenceIndex]);

  const handleAnkiGrade = useCallback((grade: 'again' | 'good' | 'easy') => {
    if (day && section) {
      void reviewSrsCard({
        dayNumber: day.dayNumber,
        sectionId: section.id,
        sentenceIndex,
        sentence,
        grade,
      });
    }
    advanceSentenceOrSection();
  }, [advanceSentenceOrSection, day, section, sentence, sentenceIndex]);

  return {
    handleMarkPatternComplete,
    handleAnkiGrade,
  };
}
