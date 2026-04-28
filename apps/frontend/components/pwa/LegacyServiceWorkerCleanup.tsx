'use client';

import { useEffect } from 'react';

/**
 * Legacy Service Worker Cleanup — Same-Origin Reverse-Proxy 모델 정착 보조 (ADR-0006)
 *
 * 사용자가 이전에 production build를 띄운 적이 있다면, 브라우저에 production SW(`/sw.js`)가
 * 등록 잔존하여 fetch을 가로챌 수 있다. dev에서는 next.config.js가 `disable: NODE_ENV==='development'`로
 * SW 등록을 비활성화하지만, **이미 등록된 SW는 자동 unregister되지 않는다**.
 *
 * 본 컴포넌트는 dev 환경에서 마운트 시 1회 모든 등록된 SW를 unregister하여 stale fetch 가로채기를 차단한다.
 * localStorage 플래그로 세션당 1회 실행을 보장하여 페이지 이동마다 반복 실행되지 않는다.
 *
 * 안전성:
 *  - dev 전용 (process.env.NODE_ENV === 'development'). production에서는 SW가 의도적으로 활성.
 *  - 실제 unregister가 발생한 경우에만 console 로그 출력 — silent operation
 *  - reload 강제하지 않음 — 사용자가 다음 진입 시 자연스럽게 SW 없는 상태
 */
const STORAGE_KEY = '__legacy_sw_cleaned_v1';

export function LegacyServiceWorkerCleanup() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    try {
      if (window.localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // localStorage 접근 실패(시크릿 모드 등) — cleanup만 시도
    }

    void navigator.serviceWorker
      .getRegistrations()
      .then((regs) => {
        if (regs.length === 0) {
          try {
            window.localStorage.setItem(STORAGE_KEY, '1');
          } catch {
            /* noop */
          }
          return;
        }
        return Promise.all(regs.map((r) => r.unregister())).then((results) => {
          const unregistered = results.filter(Boolean).length;
          console.log(
            `[LegacyServiceWorkerCleanup] Unregistered ${unregistered} legacy service worker(s).`
          );
          try {
            window.localStorage.setItem(STORAGE_KEY, '1');
          } catch {
            /* noop */
          }
        });
      })
      .catch((error) => {
        console.warn('[LegacyServiceWorkerCleanup] getRegistrations failed:', error);
      });
  }, []);

  return null;
}
