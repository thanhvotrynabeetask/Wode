export function eventToShortcut(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');

  let key = e.key;
  if (key === ' ') key = 'Space';
  else if (key.length === 1) key = key.toUpperCase();

  // Filter modifier-only key presses
  if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
    return parts.join('+');
  }

  parts.push(key);
  return parts.join('+');
}

export function matchesShortcut(e: KeyboardEvent, shortcut: string): boolean {
  const current = eventToShortcut(e);
  return current.toLowerCase() === shortcut.toLowerCase();
}
