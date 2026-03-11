'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { clearTokenCache } from '@/lib/api/api-client';
import {
  IDLE_TIMEOUT_SECONDS,
  IDLE_WARNING_BEFORE_SECONDS,
  IDLE_ACTIVITY_THROTTLE_MS,
  SESSION_SYNC_CHANNEL,
  SESSION_SYNC_MESSAGE,
  type SessionSyncMessageType,
} from '@equipment-management/shared-constants';

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const;

/** scroll, touchstart는 passive 리스너로 등록하여 스크롤 성능 보호 */
const PASSIVE_EVENTS = new Set<string>(['scroll', 'touchstart']);

export interface UseIdleTimeoutReturn {
  isWarningVisible: boolean;
  secondsRemaining: number;
  handleContinue: () => void;
  handleLogout: () => void;
}

export function useIdleTimeout(): UseIdleTimeoutReturn {
  const { status } = useSession();
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(IDLE_WARNING_BEFORE_SECONDS);
  const lastActivityRef = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isWarningVisibleRef = useRef(false);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (isWarningVisibleRef.current) {
      isWarningVisibleRef.current = false;
      setIsWarningVisible(false);
      setSecondsRemaining(IDLE_WARNING_BEFORE_SECONDS);
    }
  }, []);

  const handleLogout = useCallback(() => {
    // interval 정리 — signOut 비동기 처리 중 반복 호출 방지
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // 로그아웃 흐름 일관성: use-auth.ts logout()과 동일하게 캐시 정리
    clearTokenCache();
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const ch = new BroadcastChannel(SESSION_SYNC_CHANNEL);
      ch.postMessage({ type: SESSION_SYNC_MESSAGE.IDLE_LOGOUT });
      ch.close();
    }
    signOut({ callbackUrl: '/login' });
  }, []);

  const handleContinue = useCallback(() => {
    resetTimer();
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const ch = new BroadcastChannel(SESSION_SYNC_CHANNEL);
      ch.postMessage({ type: SESSION_SYNC_MESSAGE.ACTIVITY_RESET });
      ch.close();
    }
  }, [resetTimer]);

  // 활동 감지 + 타이머
  useEffect(() => {
    if (status !== 'authenticated') return;

    let lastThrottleTime = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastThrottleTime < IDLE_ACTIVITY_THROTTLE_MS) return;
      lastThrottleTime = now;
      resetTimer();
    };

    ACTIVITY_EVENTS.forEach((evt) => {
      const opts = PASSIVE_EVENTS.has(evt) ? { passive: true } : undefined;
      window.addEventListener(evt, handleActivity, opts as AddEventListenerOptions);
    });

    intervalRef.current = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      if (elapsedSeconds >= IDLE_TIMEOUT_SECONDS) {
        handleLogout();
        return;
      }
      const warningThreshold = IDLE_TIMEOUT_SECONDS - IDLE_WARNING_BEFORE_SECONDS;
      if (elapsedSeconds >= warningThreshold) {
        if (!isWarningVisibleRef.current) {
          isWarningVisibleRef.current = true;
          setIsWarningVisible(true);
        }
        setSecondsRemaining(IDLE_TIMEOUT_SECONDS - elapsedSeconds);
      } else if (isWarningVisibleRef.current) {
        isWarningVisibleRef.current = false;
        setIsWarningVisible(false);
      }
    }, 1_000);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, handleActivity));
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status, resetTimer, handleLogout]);

  // 다른 탭 "계속 사용" 수신 → 본 탭 타이머 리셋
  useEffect(() => {
    if (status !== 'authenticated') return;
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;

    const ch = new BroadcastChannel(SESSION_SYNC_CHANNEL);
    ch.onmessage = (event: MessageEvent<{ type: SessionSyncMessageType }>) => {
      if (event.data.type === SESSION_SYNC_MESSAGE.ACTIVITY_RESET) resetTimer();
    };
    return () => ch.close();
  }, [status, resetTimer]);

  return { isWarningVisible, secondsRemaining, handleContinue, handleLogout };
}
