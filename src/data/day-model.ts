export type SessionSectionType =
  | "warmup"
  | "verbs"
  | "sentences"
  | "modals"
  | "patterns"
  | "anki"
  | "free";

export interface SessionSection {
  id: string;
  type: SessionSectionType;
  title: string;
  sentences: string[];
  reps: number;
  duration: number; // seconds
}

export interface Day {
  dayNumber: number;
  sections: SessionSection[];
}
