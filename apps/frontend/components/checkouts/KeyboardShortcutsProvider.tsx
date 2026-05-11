'use client';

import { useState, useCallback, useEffect } from 'react';

import { KeyboardShortcutsContext } from '@/contexts/KeyboardShortcutsContext';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { KeyboardShortcutsCheatsheet } from '@/components/checkouts/KeyboardShortcutsCheatsheet';
import {
  loadShortcutOverrides,
  saveShortcutOverrides,
  resetShortcutOverrides,
  type ShortcutOverrideMap,
} from '@/lib/shortcuts/overrides';
import type { ShortcutId } from '@/lib/constants/keyboard-shortcuts';

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
}

/**
 * 키보드 단축키 Provider — 앱 루트에 1회 등록.
 * `?` 단축키로 치트시트 토글.
 *
 * Override 흐름:
 * - Mount 후 localStorage 에서 read (SSR hydration mismatch 회피)
 * - setOverride/clearOverride/resetAllOverrides 는 즉시 storage persist
 */
export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);
  const [overrides, setOverrides] = useState<ShortcutOverrideMap>({});

  // Mount 후 1회만 read — SSR/hydration mismatch 방지
  useEffect(() => {
    setOverrides(loadShortcutOverrides());
  }, []);

  const openCheatsheet = useCallback(() => setCheatsheetOpen(true), []);
  const closeCheatsheet = useCallback(() => setCheatsheetOpen(false), []);
  const toggleCheatsheet = useCallback(() => setCheatsheetOpen((prev) => !prev), []);

  const setOverride = useCallback((id: ShortcutId, key: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      if (!key) delete next[id];
      else next[id] = key;
      saveShortcutOverrides(next);
      return next;
    });
  }, []);

  const clearOverride = useCallback((id: ShortcutId) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      saveShortcutOverrides(next);
      return next;
    });
  }, []);

  const resetAllOverrides = useCallback(() => {
    resetShortcutOverrides();
    setOverrides({});
  }, []);

  useKeyboardShortcuts({ SHOW_HELP: toggleCheatsheet }, 'global', true, overrides);

  return (
    <KeyboardShortcutsContext.Provider
      value={{
        cheatsheetOpen,
        openCheatsheet,
        closeCheatsheet,
        toggleCheatsheet,
        overrides,
        setOverride,
        clearOverride,
        resetAllOverrides,
      }}
    >
      {children}
      <KeyboardShortcutsCheatsheet
        open={cheatsheetOpen}
        onOpenChange={setCheatsheetOpen}
        overrides={overrides}
      />
    </KeyboardShortcutsContext.Provider>
  );
}
