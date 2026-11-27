/**
 * Utility functions for text wrapping and formatting in diagrams (Canvas and SVG Export).
 */

/**
 * Wraps a swimlane role title into multiple lines.
 * Wraps when exceeding 3 words per line or 16 characters, ensuring balanced lines.
 */
export function wrapSwimlaneTitle(name: string, maxWordsPerLine = 3, maxCharsPerLine = 16): string[] {
  if (!name) return [];
  const trimmed = name.trim();
  if (trimmed.includes('\n')) {
    return trimmed.split('\n').flatMap((l) => wrapSwimlaneTitle(l, maxWordsPerLine, maxCharsPerLine));
  }
  const words = trimmed.split(/\s+/);
  if (words.length <= maxWordsPerLine && trimmed.length <= maxCharsPerLine) {
    return [trimmed];
  }

  const lines: string[] = [];
  let currentWords: string[] = [];
  let currentLen = 0;

  for (const word of words) {
    const wouldExceedWords = currentWords.length >= maxWordsPerLine;
    const wouldExceedChars = currentLen + word.length + (currentWords.length > 0 ? 1 : 0) > maxCharsPerLine;

    if (currentWords.length > 0 && (wouldExceedWords || wouldExceedChars)) {
      lines.push(currentWords.join(' '));
      currentWords = [word];
      currentLen = word.length;
    } else {
      currentWords.push(word);
      currentLen += (currentWords.length > 1 ? 1 : 0) + word.length;
    }
  }

  if (currentWords.length > 0) {
    lines.push(currentWords.join(' '));
  }

  return lines;
}

/**
 * Wraps node title or label text into multiple lines based on character limits and word boundaries.
 */
export function wrapNodeText(text: string, maxCharsPerLine = 20, maxLines = 4): string[] {
  if (!text) return [];
  const rawLines = text.split('\n');
  const result: string[] = [];

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (trimmed.length <= maxCharsPerLine) {
      result.push(trimmed);
      continue;
    }

    const words = trimmed.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      if (!currentLine) {
        currentLine = word;
      } else if (currentLine.length + 1 + word.length <= maxCharsPerLine) {
        currentLine += ' ' + word;
      } else {
        result.push(currentLine);
        currentLine = word;
        if (result.length >= maxLines - 1) {
          break;
        }
      }
    }

    if (currentLine && result.length < maxLines) {
      result.push(currentLine);
    }
  }

  return result.slice(0, maxLines);
}
