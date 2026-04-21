'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY_PREFIX = 'onboarding-dismissed:';

/**
 * 온보딩 힌트 표시 여부를 localStorage로 관리
 *
 * - SSR 안전: useEffect에서만 localStorage 접근 (hydration 불일치 방지)
 * - dismiss() 호출 시 localStorage에 저장 → 재방문 시 숨김
 */
export function useOnboardingHint(id: string) {
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`);
    setDismissed(stored === 'true');
  }, [id]);

  const dismiss = () => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${id}`, 'true');
    setDismissed(true);
  };

  const isVisible = dismissed === false;

  return { isVisible, dismiss };
}
