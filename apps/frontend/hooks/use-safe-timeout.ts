'use client';

import { useRef, useCallback, useEffect } from 'react';

/**
 * 컴포넌트 언마운트 시 자동 정리되는 setTimeout 훅
 *
 * 문제: 직접 setTimeout 호출 시 컴포넌트 언마운트 후에도
 * 콜백이 실행되어 setState on unmounted component 경고 및 메모리 누수 발생.
 *
 * 해결: 모든 타이머 ID를 추적하고 언마운트 시 일괄 clearTimeout.
 *
 * @example
 * const setSafeTimeout = useSafeTimeout();
 *
 * // mutation onSuccessCallback 내부
 * setSafeTimeout(() => {
 *   setExitingIds((prev) => { ... });
 * }, APPROVAL_MOTION.exitDurationMs);
 */
export function useSafeTimeout(): (callback: () => void, delay: number) => void {
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  return useCallback((callback: () => void, delay: number) => {
    const id = setTimeout(() => {
      // 실행된 타이머는 배열에서 제거 (GC 허용)
      timersRef.current = timersRef.current.filter((t) => t !== id);
      callback();
    }, delay);
    timersRef.current.push(id);
  }, []);
}
