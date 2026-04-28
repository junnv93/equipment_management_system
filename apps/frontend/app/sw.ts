import { defaultCache } from '@serwist/next/worker';
import { NetworkOnly, Serwist } from 'serwist';
import type { PrecacheEntry, RuntimeCaching } from 'serwist';

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[];
};

/**
 * Same-Origin Reverse-Proxy 모델(ADR-0006) — API 응답 캐시 강제 차단.
 *
 * defaultCache는 same-origin GET 응답을 StaleWhileRevalidate로 캐시하는데,
 * 이게 `/api/auth/csrf`/`/api/auth/session` 같은 NextAuth 응답에 적용되면
 * stale CSRF 토큰으로 signIn POST가 차단되거나 stale 세션 메타가 노출된다.
 *
 * `/api/*` 경로는 NetworkOnly로 강제하여 모든 API 응답이 항상 백엔드(또는 NextAuth handler)에
 * 도달하도록 한다. 이는 SSE(`/api/notifications/stream`) 같은 long-lived connection에도 안전.
 *
 * defaultCache보다 먼저 등록되어야 routeMatch가 우선 평가된다 (serwist는 첫 매칭 우선).
 */
const apiNetworkOnly: RuntimeCaching = {
  matcher: ({ url }) => url.pathname.startsWith('/api/'),
  handler: new NetworkOnly(),
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [apiNetworkOnly, ...defaultCache],
  fallbacks: {
    entries: [
      {
        url: '/~offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

serwist.addEventListeners();
