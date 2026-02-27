import type { ReviewBlock } from './review-plan.types';

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function parseReviewBlocks(value: unknown): ReviewBlock[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const parsed: ReviewBlock[] = [];
  for (const rawBlock of value) {
    if (!isObject(rawBlock)) {
      return null;
    }
    const { id, title, instructions, durationMinutes } = rawBlock;
    if (typeof id !== 'string' || id.length === 0) {
      return null;
    }
    if (typeof title !== 'string' || title.length === 0) {
      return null;
    }
    if (!isStringArray(instructions) || instructions.length === 0) {
      return null;
    }
    if (durationMinutes !== undefined && !isPositiveInteger(durationMinutes)) {
      return null;
    }
    parsed.push({
      id,
      title,
      instructions,
      ...(durationMinutes !== undefined ? { durationMinutes } : {}),
    });
  }
  return parsed;
}
