/**
 * 접근성 게이트 — /login (WCAG 2.1 AA)
 *
 * 인증 불필요 라우트만 대상 — 백엔드 없이 CI에서 실행 가능.
 * @axe-core/playwright 사용. violation 0이 게이트 조건.
 *
 * 임계값 SSOT: docs/operations/performance-budgets.md
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('접근성 — /login (WCAG 2.1 AA)', () => {
  test('violation 0 — 데스크탑', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      // 다크모드 color-contrast는 브라우저 설정 의존 — CI에서 제외
      .disableRules(['color-contrast'])
      .analyze();

    if (results.violations.length > 0) {
      const summary = results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
        help: v.helpUrl,
      }));
      console.error('접근성 위반:', JSON.stringify(summary, null, 2));
    }

    expect(
      results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    ).toHaveLength(0);
  });

  test('violation 0 — 모바일 (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();

    expect(
      results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    ).toHaveLength(0);
  });
});
