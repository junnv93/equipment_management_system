/**
 * useOnlineStatus — 브라우저 네트워크 상태 추적 (대시보드 개선안 §A.17.3).
 *
 * `navigator.onLine` + 'online'/'offline' 이벤트 리스닝.
 * SSR 안전: 서버 렌더링 시 `online: true` 가정 (낙관적 fallback).
 *
 * 반환값:
 *  - online      : 현재 온라인 상태
 *  - lastOnlineAt: 마지막으로 온라인이었던 시각 (Date | null). offline 진입 시점 기록.
 */

'use client';

import { useEffect, useState } from 'react';

export interface OnlineStatus {
  online: boolean;
  /** offline 진입 시점 (online 상태에서는 null). */
  lastOnlineAt: Date | null;
}

export function useOnlineStatus(): OnlineStatus {
  const [online, setOnline] = useState<boolean>(() => {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setLastOnlineAt(null);
    };
    const handleOffline = () => {
      setOnline(false);
      setLastOnlineAt(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 마운트 시점 정합성: navigator.onLine과 state 동기화.
    // functional setter로 의존성 없이(deps=[]) state 비교 — exhaustive-deps 룰 충족.
    setOnline((prev) => (prev === navigator.onLine ? prev : navigator.onLine));
    if (!navigator.onLine) {
      setLastOnlineAt((prev) => prev ?? new Date());
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { online, lastOnlineAt };
}
