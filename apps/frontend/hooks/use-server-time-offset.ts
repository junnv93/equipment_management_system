'use client';

import { useState, useEffect } from 'react';
import { fetchServerTimeDelta } from '@/lib/api/server-time-api';

/**
 * 서버-클라이언트 시각 오프셋 hook (SH-5 — drift-once-on-mount 패턴).
 *
 * 컴포넌트 마운트 시 서버 시각을 1회 fetch → delta(ms) 계산 후 반환.
 * 이후 호출자는 `Date.now() + serverTimeDeltaMs`로 skew-corrected 시각 사용.
 *
 * SSR safe: typeof window 가드. 서버에서는 delta=0 반환 (hydration mismatch 방지).
 * 오류 시 delta=0 폴백 — useRevocationWindow 5초 오차는 허용 가능 수준.
 */
export function useServerTimeOffset(): number {
  const [delta, setDelta] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    fetchServerTimeDelta()
      .then(setDelta)
      .catch(() => {
        // 네트워크 오류 시 delta=0 폴백 — clock skew 미보정 상태로 유지
      });
  }, []);

  return delta;
}
