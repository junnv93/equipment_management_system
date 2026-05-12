'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';

import { KeyboardShortcutsContext } from '@/contexts/KeyboardShortcutsContext';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { KeyboardShortcutsCheatsheet } from '@/components/checkouts/KeyboardShortcutsCheatsheet';
import {
  loadShortcutOverrides,
  saveShortcutOverrides,
  resetShortcutOverrides,
  SHORTCUT_OVERRIDES_STORAGE_KEY,
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
 * - Multi-tab sync: window storage event 로 다른 탭 변경 즉시 반영 (G-16)
 */
export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);
  const [overrides, setOverrides] = useState<ShortcutOverrideMap>({});

  // Mount 후 1회만 read — SSR/hydration mismatch 방지
  useEffect(() => {
    setOverrides(loadShortcutOverrides());
  }, []);

  // Multi-tab sync — 다른 탭에서 SSOT storage key 변경 시 reload
  // storage event 는 same-origin 다른 탭에서만 발화 → 같은 탭 navigate 불필요
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage) return;
      if (event.key !== null && event.key !== SHORTCUT_OVERRIDES_STORAGE_KEY) return;
      // event.key === null → localStorage.clear() 또는 사파리 일부 → 전체 reload
      setOverrides(loadShortcutOverrides());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
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

  // Context value 의 referential stability — useState setter 와 useCallback 핸들러는 stable,
  // overrides/cheatsheetOpen 만 변경 의존성. consumer 의 불필요한 re-render 차단.
  const contextValue = useMemo(
    () => ({
      cheatsheetOpen,
      openCheatsheet,
      closeCheatsheet,
      toggleCheatsheet,
      overrides,
      setOverride,
      clearOverride,
      resetAllOverrides,
    }),
    [
      cheatsheetOpen,
      openCheatsheet,
      closeCheatsheet,
      toggleCheatsheet,
      overrides,
      setOverride,
      clearOverride,
      resetAllOverrides,
    ]
  );

  return (
    <KeyboardShortcutsContext.Provider value={contextValue}>
      {children}
      <KeyboardShortcutsCheatsheet open={cheatsheetOpen} onOpenChange={setCheatsheetOpen} />
    </KeyboardShortcutsContext.Provider>
  );
}
