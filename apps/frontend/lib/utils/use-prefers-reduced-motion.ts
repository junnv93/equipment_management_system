'use client';

import { useEffect, useState } from 'react';

/**
 * prefers-reduced-motion 미디어 쿼리 hook
 *
 * SSR: matchMedia가 없는 환경(서버)에서는 false 반환.
 * 접근성: 사용자가 OS에서 모션 감소를 선호하면 true.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}
