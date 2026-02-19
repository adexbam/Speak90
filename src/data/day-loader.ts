import type { Day, SessionSection, SessionSectionType } from "./day-model";

const SECTION_TYPES: readonly SessionSectionType[] = [
  "warmup",
  "verbs",
  "sentences",
  "modals",
  "patterns",
  "anki",
  "free",
];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isSectionType(value: unknown): value is SessionSectionType {
  return typeof value === "string" && SECTION_TYPES.includes(value as SessionSectionType);
}

function assertValidSection(value: unknown, dayNumber: number, sectionIndex: number): SessionSection {
  if (!isObject(value)) {
    throw new Error(`Day ${dayNumber}, section ${sectionIndex}: section must be an object.`);
  }

  const { id, type, title, sentences, reps, duration } = value;

  if (typeof id !== "string" || id.length === 0) {
    throw new Error(`Day ${dayNumber}, section ${sectionIndex}: invalid id.`);
  }

  if (!isSectionType(type)) {
    throw new Error(`Day ${dayNumber}, section ${sectionIndex}: invalid type "${String(type)}".`);
  }

  if (typeof title !== "string" || title.length === 0) {
    throw new Error(`Day ${dayNumber}, section ${sectionIndex}: invalid title.`);
  }

  if (!isStringArray(sentences) || sentences.length === 0) {
    throw new Error(`Day ${dayNumber}, section ${sectionIndex}: sentences must be a non-empty string array.`);
  }

  if (typeof reps !== "number" || !Number.isFinite(reps) || reps <= 0) {
    throw new Error(`Day ${dayNumber}, section ${sectionIndex}: reps must be a positive number.`);
  }

  if (typeof duration !== "number" || !Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Day ${dayNumber}, section ${sectionIndex}: duration must be a positive number.`);
  }

  return { id, type, title, sentences, reps, duration };
}

function assertValidDay(value: unknown, index: number): Day {
  if (!isObject(value)) {
    throw new Error(`Day at index ${index} must be an object.`);
  }

  const { dayNumber, sections } = value;

  if (typeof dayNumber !== "number" || !Number.isInteger(dayNumber) || dayNumber <= 0) {
    throw new Error(`Day at index ${index} has invalid dayNumber.`);
  }

  if (!Array.isArray(sections) || sections.length === 0) {
    throw new Error(`Day ${dayNumber}: sections must be a non-empty array.`);
  }

  return {
    dayNumber,
    sections: sections.map((section, sectionIndex) => assertValidSection(section, dayNumber, sectionIndex)),
  };
}

let cachedDays: Day[] | null = null;

export function loadDays(expectedDayCount?: number): Day[] {
  if (cachedDays) {
    if (typeof expectedDayCount === "number" && cachedDays.length !== expectedDayCount) {
      throw new Error(`Expected ${expectedDayCount} days, received ${cachedDays.length}.`);
    }
    return cachedDays;
  }

  const rawData: unknown = require("../../assets/data/days.json");

  if (!Array.isArray(rawData)) {
    throw new Error("Days data must be an array.");
  }

  const days = rawData.map((day, index) => assertValidDay(day, index));
  const sorted = [...days].sort((a, b) => a.dayNumber - b.dayNumber);

  if (sorted.length === 0) {
    throw new Error("Expected at least one day, received 0.");
  }

  if (typeof expectedDayCount === "number" && sorted.length !== expectedDayCount) {
    throw new Error(`Expected ${expectedDayCount} days, received ${sorted.length}.`);
  }

  sorted.forEach((day, index) => {
    const expectedDayNumber = index + 1;
    if (day.dayNumber !== expectedDayNumber) {
      throw new Error(
        `Day sequence is invalid at index ${index}: expected day ${expectedDayNumber}, received day ${day.dayNumber}.`
      );
    }
  });

  cachedDays = sorted;
  return cachedDays;
}

export function getDayByNumber(dayNumber: number): Day | undefined {
  if (!Number.isInteger(dayNumber) || dayNumber <= 0) {
    return undefined;
  }

  return loadDays().find((day) => day.dayNumber === dayNumber);
}
