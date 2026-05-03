'use strict';

/**
 * Lighthouse CI 설정 — UL Equipment Management System
 *
 * 대상 라우트: docs/operations/quality-audit-routes.json publicRoutes 중 lighthouse=true
 * 인증 불필요 공개 라우트만 실행한다. 인증 라우트는 Playwright E2E/a11y에서 storageState 기반 검증.
 * 임계값 SSOT: docs/operations/performance-budgets.md
 *
 * @type {import('@lhci/cli').LhciConfig}
 */
const qualityAuditRoutes = require('./docs/operations/quality-audit-routes.json');

const authenticatedLighthouseRoutes = qualityAuditRoutes.authenticatedRoutes.filter(
  (route) => route.lighthouse
);
if (authenticatedLighthouseRoutes.length > 0) {
  throw new Error(
    `Authenticated Lighthouse routes require an explicit login flow first: ${authenticatedLighthouseRoutes
      .map((route) => route.id)
      .join(', ')}`
  );
}

const publicLighthouseUrls = qualityAuditRoutes.publicRoutes
  .filter((route) => route.lighthouse)
  .map((route) => `http://localhost:3000${route.path}`);

if (publicLighthouseUrls.length === 0) {
  throw new Error('No public Lighthouse routes configured in quality-audit-routes.json');
}

module.exports = {
  ci: {
    collect: {
      url: publicLighthouseUrls,
      startServerCommand: 'pnpm --filter frontend run start',
      startServerReadyPattern: 'Ready in',
      startServerReadyTimeout: 30000,
      numberOfRuns: 1,
      settings: {
        // Desktop audit: screenEmulation.mobile=false와 formFactor를 명시적으로 동기화.
        formFactor: 'desktop',
        // CI 환경 Chrome 플래그
        chromeFlags: '--no-sandbox --disable-gpu --disable-dev-shm-usage',
        // PWA 관련 감사 제외 (현재 개발 단계)
        skipAudits: ['uses-http2', 'redirects-http', 'uses-long-cache-ttl'],
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        },
      },
    },
    assert: {
      assertions: {
        // Performance (경고 — 인프라 환경에 따라 변동)
        'categories:performance': ['warn', { minScore: 0.9 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],

        // Accessibility (오류 — CI 게이트)
        'categories:accessibility': ['error', { minScore: 0.95 }],

        // Best Practices / SEO (경고)
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],

        // PWA 감사 비활성화 (개발 단계)
        'installable-manifest': 'off',
        'service-worker': 'off',
        'splash-screen': 'off',
        'themed-omnibox': 'off',
        'content-width': 'off',
        viewport: 'off',
      },
    },
    upload: {
      // CI 서버 없이 로컬 파일시스템에 저장 → GH Actions artifact로 업로드
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
