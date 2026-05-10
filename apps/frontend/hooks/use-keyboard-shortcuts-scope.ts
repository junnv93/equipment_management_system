'use client';

import { useContext } from 'react';
import { KeyboardShortcutsContext } from '@/contexts/KeyboardShortcutsContext';

/**
 * 현재 키보드 단축키 컨텍스트 접근.
 * Provider 없이 사용 시 no-op 기본값 반환 (graceful degradation).
 */
export function useKeyboardShortcutsScope() {
  return useContext(KeyboardShortcutsContext);
}
