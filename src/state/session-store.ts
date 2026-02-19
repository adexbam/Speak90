import { create } from 'zustand';

type SessionUiState = {
  patternRevealed: boolean;
  ankiFlipped: boolean;
  patternCompleted: Record<number, true>;
  setPatternRevealed: (value: boolean) => void;
  setAnkiFlipped: (value: boolean) => void;
  markPatternCompleted: (sentenceIndex: number) => void;
  resetForSection: () => void;
  resetForSentence: () => void;
};

export const useSessionStore = create<SessionUiState>((set) => ({
  patternRevealed: false,
  ankiFlipped: false,
  patternCompleted: {},
  setPatternRevealed: (value) => set({ patternRevealed: value }),
  setAnkiFlipped: (value) => set({ ankiFlipped: value }),
  markPatternCompleted: (sentenceIndex) =>
    set((state) => ({
      patternCompleted: { ...state.patternCompleted, [sentenceIndex]: true },
    })),
  resetForSection: () =>
    set({
      patternRevealed: false,
      ankiFlipped: false,
      patternCompleted: {},
    }),
  resetForSentence: () =>
    set({
      patternRevealed: false,
      ankiFlipped: false,
    }),
}));
