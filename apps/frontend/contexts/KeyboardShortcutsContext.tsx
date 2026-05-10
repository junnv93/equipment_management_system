'use client';

import { createContext } from 'react';

export interface KeyboardShortcutsContextValue {
  cheatsheetOpen: boolean;
  openCheatsheet: () => void;
  closeCheatsheet: () => void;
  toggleCheatsheet: () => void;
}

const noop = () => undefined;

export const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextValue>({
  cheatsheetOpen: false,
  openCheatsheet: noop,
  closeCheatsheet: noop,
  toggleCheatsheet: noop,
});
