/**
 * Playwright 설정 — 접근성 감사 전용
 *
 * 기존 playwright.config.ts와 분리:
 * - globalSetup 없음 (인증 불필요)
 * - 공개 라우트만 대상 (/login)
 * - backend 서비스 불필요
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/a11y',
  testMatch: '**/*.a11y.spec.ts',
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
