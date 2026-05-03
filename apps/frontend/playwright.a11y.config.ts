/**
 * Playwright 설정 — 공개 라우트 접근성 감사 전용
 *
 * 기존 playwright.config.ts와 분리:
 * - globalSetup 없음 (인증 불필요)
 * - 공개 라우트만 대상 (docs/operations/quality-audit-routes.json publicRoutes)
 * - backend 서비스 불필요
 *
 * 인증이 필요한 `tests/e2e/a11y/*.a11y.spec.ts`는 기본 playwright.config.ts의
 * setup project + storageState 흐름에서 실행한다.
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/a11y',
  testMatch: 'login.a11y.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['html', { open: 'never', outputFolder: 'playwright-report-a11y' }], ['list']],
  timeout: 30000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
