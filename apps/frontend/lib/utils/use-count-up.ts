'use client';

import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

interface UseCountUpOptions {
  target: number;
  duration?: number;
  precision?: number;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * 숫자 카운트업 애니메이션 hook
 *
 * - prefers-reduced-motion: 즉시 target 값으로 이동
 * - 기본: easeOutCubic RAF 루프
 */
export function useCountUp({ target, duration = 800, precision = 0 }: UseCountUpOptions): number {
  const [value, setValue] = useState(target);
  const rafRef = useRef<number | null>(null);
  const fromRef = useRef(target);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setValue(target);
      fromRef.current = target;
      return;
    }

    const from = fromRef.current;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const current = from + (target - from) * eased;

      const factor = Math.pow(10, precision);
      setValue(Math.round(current * factor) / factor);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [target, duration, precision, prefersReducedMotion]);

  return value;
}
