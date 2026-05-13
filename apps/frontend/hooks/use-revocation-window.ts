'use client';

import { useEffect, useState } from 'react';

import { APPROVAL_REVOCATION_WINDOW_MS } from '@equipment-management/shared-constants';

/**
 * 승인 철회 윈도우 countdown hook (S-2, SH-5).
 *
 * SSOT: `APPROVAL_REVOCATION_WINDOW_MS` (`packages/shared-constants/src/business-rules.ts`).
 * 5분(300_000ms) backend SSOT 단일 import — frontend 인라인 0건 (CLAUDE.md Rule 0).
 *
 * @param approvedAt ISO 8601 timestamp 또는 null/undefined (미승인 상태)
 * @param serverTimeDeltaMs 서버-클라이언트 시각 오프셋(ms). `useServerTimeOffset()` 반환값.
 *   기본값 0 — 미전달 시 client `Date.now()` 기반 (backward compat 유지).
 *   clock skew > 5초 환경 보정용 (SH-5).
 * @returns
 *   - `remainingMs`: 남은 ms (음수면 0으로 clamp)
 *   - `mmss`: `mm:ss` 형식 문자열 (만료 시 `0:00`)
 *   - `isExpired`: 윈도우 만료 여부
 *   - `isActive`: 윈도우 진행 중 (approvedAt 유효 + 만료 전)
 *
 * SSR safe: `typeof window === 'undefined'` 가드.
 * 만료 시 setInterval cleanup — 메모리 누수 방지.
 */
export interface RevocationWindow {
  remainingMs: number;
  mmss: string;
  isExpired: boolean;
  isActive: boolean;
}

function formatMmss(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function computeRemaining(
  approvedAt: string | null | undefined,
  serverTimeDeltaMs: number
): number {
  if (!approvedAt) return 0;
  const approvedTime = new Date(approvedAt).getTime();
  if (Number.isNaN(approvedTime)) return 0;
  // skew-corrected 현재 시각 사용: Date.now() + delta ≈ 서버 현재 시각
  const now = Date.now() + serverTimeDeltaMs;
  const elapsed = now - approvedTime;
  return Math.max(0, APPROVAL_REVOCATION_WINDOW_MS - elapsed);
}

export function useRevocationWindow(
  approvedAt: string | null | undefined,
  serverTimeDeltaMs = 0
): RevocationWindow {
  const [remainingMs, setRemainingMs] = useState<number>(() =>
    computeRemaining(approvedAt, serverTimeDeltaMs)
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!approvedAt) {
      setRemainingMs(0);
      return;
    }

    setRemainingMs(computeRemaining(approvedAt, serverTimeDeltaMs));

    const intervalId = window.setInterval(() => {
      const next = computeRemaining(approvedAt, serverTimeDeltaMs);
      setRemainingMs(next);
      if (next <= 0) {
        window.clearInterval(intervalId);
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [approvedAt, serverTimeDeltaMs]);

  const isExpired = remainingMs <= 0;
  const isActive = Boolean(approvedAt) && !isExpired;

  return {
    remainingMs,
    mmss: formatMmss(remainingMs),
    isExpired,
    isActive,
  };
}
