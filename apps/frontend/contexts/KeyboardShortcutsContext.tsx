'use client';

import { createContext } from 'react';
import type { ShortcutId } from '@/lib/constants/keyboard-shortcuts';
import type { ShortcutOverrideMap } from '@/lib/shortcuts/overrides';

export interface KeyboardShortcutsContextValue {
  cheatsheetOpen: boolean;
  openCheatsheet: () => void;
  closeCheatsheet: () => void;
  toggleCheatsheet: () => void;
  /** 사용자 override map — Provider mount 후 localStorage 에서 read */
  overrides: ShortcutOverrideMap;
  /** 단일 단축키 키 변경. 빈 문자열은 reset(SSOT key 복귀)과 동일. */
  setOverride: (id: ShortcutId, key: string) => void;
  /** 단일 단축키 reset (SSOT 복귀) */
  clearOverride: (id: ShortcutId) => void;
  /** 전체 reset */
  resetAllOverrides: () => void;
}

const noop = () => undefined;

export const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextValue>({
  cheatsheetOpen: false,
  openCheatsheet: noop,
  closeCheatsheet: noop,
  toggleCheatsheet: noop,
  overrides: {},
  setOverride: noop,
  clearOverride: noop,
  resetAllOverrides: noop,
});
