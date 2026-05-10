'use client';

import { useState, useCallback } from 'react';

import { KeyboardShortcutsContext } from '@/contexts/KeyboardShortcutsContext';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { KeyboardShortcutsCheatsheet } from '@/components/checkouts/KeyboardShortcutsCheatsheet';

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
}

/**
 * 키보드 단축키 Provider — 앱 루트에 1회 등록.
 * `?` 단축키로 치트시트 토글.
 */
export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);

  const openCheatsheet = useCallback(() => setCheatsheetOpen(true), []);
  const closeCheatsheet = useCallback(() => setCheatsheetOpen(false), []);
  const toggleCheatsheet = useCallback(() => setCheatsheetOpen((prev) => !prev), []);

  useKeyboardShortcuts({ SHOW_HELP: toggleCheatsheet }, 'global');

  return (
    <KeyboardShortcutsContext.Provider
      value={{ cheatsheetOpen, openCheatsheet, closeCheatsheet, toggleCheatsheet }}
    >
      {children}
      <KeyboardShortcutsCheatsheet open={cheatsheetOpen} onOpenChange={setCheatsheetOpen} />
    </KeyboardShortcutsContext.Provider>
  );
}
