/**
 * 접근성 게이트 — 공개 라우트 (WCAG 2.1 AA)
 *
 * 인증 불필요 라우트만 대상 — 백엔드 없이 CI에서 실행 가능.
 * @axe-core/playwright 사용. violation 0이 게이트 조건.
 *
 * 대상 라우트 SSOT: docs/operations/quality-audit-routes.json
 * 임계값 SSOT: docs/operations/performance-budgets.md
 */

import { test, expect } from '@playwright/test';
import { runAxe, assertNoHighImpact } from '../shared/utils/a11y-helper';
import { getPublicA11yRoutes } from '../shared/utils/quality-audit-routes';

const publicRoutes = getPublicA11yRoutes();

test.describe('접근성 — 공개 라우트 (WCAG 2.1 AA)', () => {
  test.beforeAll(() => {
    expect(publicRoutes.length, 'public a11y routes must be configured').toBeGreaterThan(0);
  });

  for (const route of publicRoutes) {
    test(`${route.label} — 데스크탑`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState('domcontentloaded');

      const results = await runAxe(page);
      assertNoHighImpact(results);
    });

    test(`${route.label} — 모바일 (375px)`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(route.path);
      await page.waitForLoadState('domcontentloaded');

      const results = await runAxe(page);
      assertNoHighImpact(results);
    });
  }
});
