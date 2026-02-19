export function parseBilingualPair(input: string): { front: string; back: string } {
  const text = input.trim();
  if (!text) {
    return { front: '', back: '' };
  }

  const separator = '->';
  const separatorIndex = text.indexOf(separator);

  if (separatorIndex < 0) {
    return { front: text, back: text };
  }

  const front = text.slice(0, separatorIndex).trim();
  const back = text.slice(separatorIndex + separator.length).trim();

  if (!front && !back) {
    return { front: text, back: text };
  }

  if (!front) {
    return { front: back, back };
  }

  if (!back) {
    return { front, back: front };
  }

  return { front, back };
}
