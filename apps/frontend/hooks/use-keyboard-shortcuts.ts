'use client';

import { useEffect, useCallback, useRef } from 'react';
import {
  KEYBOARD_SHORTCUTS,
  type ShortcutDef,
  type ShortcutId,
  type ShortcutScope,
} from '@/lib/constants/keyboard-shortcuts';
import type { ShortcutOverrideMap } from '@/lib/shortcuts/overrides';

type ShortcutHandlers = Partial<Record<ShortcutId, () => void>>;

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isInputFocused(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return INPUT_TAGS.has(target.tagName) || target.isContentEditable;
}

function effectiveKey(id: ShortcutId, def: ShortcutDef, overrides: ShortcutOverrideMap): string {
  return overrides[id] ?? def.key;
}

function matchesShortcut(
  e: KeyboardEvent,
  id: ShortcutId,
  overrides: ShortcutOverrideMap
): boolean {
  const def: ShortcutDef = KEYBOARD_SHORTCUTS[id];
  if (e.key !== effectiveKey(id, def, overrides)) return false;

  const mods = def.modifiers ?? [];
  if (mods.includes('ctrl') !== e.ctrlKey) return false;
  if (mods.includes('shift') !== e.shiftKey) return false;
  if (mods.includes('alt') !== e.altKey) return false;
  if (mods.includes('meta') !== e.metaKey) return false;

  return true;
}

/**
 * 키보드 단축키 등록 훅.
 *
 * - IME 가드: e.isComposing (compositionstart 리스너 금지)
 * - 입력 포커스 가드: INPUT/TEXTAREA/SELECT/contenteditable → allowInInput 제외 skip
 * - 이벤트는 keydown (keypress deprecated)
 * - handlers / overrides 는 ref 추적 — scope/enabled 변경 시에만 리스너 재등록
 * - overrides: SSOT KEYBOARD_SHORTCUTS 위에 user 별 키 override 적용 (modifier 변경 불가)
 */
export function useKeyboardShortcuts(
  handlers: ShortcutHandlers,
  scope: ShortcutScope,
  enabled = true,
  overrides: ShortcutOverrideMap = {}
): void {
  const handlersRef = useRef(handlers);
  const overridesRef = useRef(overrides);
  useEffect(() => {
    handlersRef.current = handlers;
  });
  useEffect(() => {
    overridesRef.current = overrides;
  });

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.isComposing) return;

      const focusedInInput = isInputFocused(e.target);

      for (const [id, handler] of Object.entries(handlersRef.current) as [
        ShortcutId,
        () => void,
      ][]) {
        if (!handler) continue;
        const def: ShortcutDef = KEYBOARD_SHORTCUTS[id];
        if (def.scope !== scope && def.scope !== 'global') continue;
        if (focusedInInput && !def.allowInInput) continue;
        if (!matchesShortcut(e, id, overridesRef.current)) continue;

        e.preventDefault();
        handler();
        return;
      }
    },
    [scope]
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}
