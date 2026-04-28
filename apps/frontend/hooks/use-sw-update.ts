'use client';

import * as React from 'react';

/**
 * useSwUpdate — Service Worker 업데이트 가용성 감지
 *
 * - registration.onupdatefound + installing.onstatechange = 'installed' 시 newAvailable=true
 * - controllerchange (새 SW 활성화) 시 reload 필요
 *
 * 반환:
 * - newAvailable: 새 버전 설치되어 reload 시 적용 가능
 * - applyUpdate: skipWaiting + reload 트리거 (사용자 클릭 핸들러)
 *
 * SSR 안전: window/navigator 가드. SW 미지원 환경 fallback.
 */
export interface SwUpdateState {
  newAvailable: boolean;
  applyUpdate: () => void;
}

export function useSwUpdate(): SwUpdateState {
  const [newAvailable, setNewAvailable] = React.useState(false);
  const waitingRef = React.useRef<ServiceWorker | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let cancelled = false;

    navigator.serviceWorker
      .getRegistration()
      .then((registration) => {
        if (cancelled || !registration) return;

        // 이미 waiting 상태인 SW가 있으면 즉시 가용
        if (registration.waiting) {
          waitingRef.current = registration.waiting;
          setNewAvailable(true);
        }

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              waitingRef.current = installing;
              setNewAvailable(true);
            }
          });
        });
      })
      .catch(() => {
        // 등록 정보 조회 실패는 banner 비활성으로 fallback
      });

    const onControllerChange = () => {
      // 새 SW가 활성화됨 → reload로 새 버전 적용
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  const applyUpdate = React.useCallback(() => {
    const waiting = waitingRef.current;
    if (waiting) {
      waiting.postMessage({ type: 'SKIP_WAITING' });
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, []);

  return { newAvailable, applyUpdate };
}
