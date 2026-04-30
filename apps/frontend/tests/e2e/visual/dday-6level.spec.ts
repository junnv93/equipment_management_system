/**
 * Visual Regression — D-day 6-level (Sprint 4.5 S4)
 *
 * 6-level (relaxed / normal / warning-soft / urgent / overdue-light / critical-pulse) 의
 * 시각 일관성을 baseline 스크린샷으로 잠근다.
 *
 * 인프라 결정: Storybook 도입 회피 (50MB devDep + CI runtime ~2분 ↑) — 기존
 * Playwright `toHaveScreenshot()` 재사용. 의존성 추가 0.
 *
 * 실행:
 *   pnpm --filter frontend exec playwright test visual/dday-6level --project=chromium
 *
 * Baseline 갱신 (의도된 디자인 토큰 변경 시):
 *   pnpm --filter frontend exec playwright test visual/dday-6level --update-snapshots
 *
 * Fixture: apps/frontend/app/(dashboard)/__visual__/dday/page.tsx (dev-only, production은 notFound)
 */

import { test, expect } from '@playwright/test';
import path from 'node:path';

const AUTH_DIR = path.join(__dirname, '../.auth');
const FIXTURE_PATH = '/__visual__/dday';

// 6-level은 fixture page에서 SSOT 임계값으로 자동 매핑 — 본 spec은 level 카운트만 alert.
const EXPECTED_LEVELS = [1, 2, 3, 4, 5, 6] as const;

test.describe('D-day 6-level visual regression (light)', () => {
  test.use({
    storageState: path.join(AUTH_DIR, 'test-engineer.json'),
    colorScheme: 'light',
  });

  for (const level of EXPECTED_LEVELS) {
    test(`level ${level} — light theme baseline`, async ({ page }) => {
      await page.goto(FIXTURE_PATH);
      const item = page.getByTestId(`dday-level-${level}`);
      await expect(item).toBeVisible();
      await expect(item).toHaveScreenshot(`dday-level-${level}-light.png`, {
        animations: 'disabled',
        maxDiffPixelRatio: 0.02,
      });
    });
  }
});

test.describe('D-day 6-level visual regression (dark)', () => {
  test.use({
    storageState: path.join(AUTH_DIR, 'test-engineer.json'),
    colorScheme: 'dark',
  });

  for (const level of EXPECTED_LEVELS) {
    test(`level ${level} — dark theme baseline`, async ({ page }) => {
      await page.goto(FIXTURE_PATH);
      const item = page.getByTestId(`dday-level-${level}`);
      await expect(item).toBeVisible();
      await expect(item).toHaveScreenshot(`dday-level-${level}-dark.png`, {
        animations: 'disabled',
        maxDiffPixelRatio: 0.02,
      });
    });
  }
});
