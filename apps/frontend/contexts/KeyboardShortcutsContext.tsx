'use client';

import { createContext, useContext } from 'react';
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

// 코드베이스 표준 패턴 (BreadcrumbContext 와 동일) — createContext default = undefined.
// 소비 진입점: useKeyboardShortcutsContext (strict consumer, Provider 누락 시 throw)
export const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextValue | undefined>(
  undefined
);

/**
 * KeyboardShortcutsContext 단일 소비 진입점 (strict).
 *
 * Provider mount 가 보장된 컴포넌트에서 사용. Provider 누락 시 즉시 throw 로 개발 단계 회귀 차단.
 * (코드베이스 표준: `useBreadcrumb` 와 동일한 패턴 — React 공식 + Radix UI / shadcn 표준)
 */
export function useKeyboardShortcutsContext(): KeyboardShortcutsContextValue {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcutsContext must be used within KeyboardShortcutsProvider');
  }
  return context;
}
