import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/calibration-overdue-auto-nc/**', // Exclude tests with missing fixtures
    '**/../backend/**', // Exclude backend tests
    '**/backend/**', // Exclude all backend directory
    '**/__tests__/**', // Exclude backend test directories
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  reporter: 'html',
  // 기본 타임아웃 설정 (안정성 향상)
  timeout: 60000, // 60초
  expect: {
    timeout: 15000, // expect 타임아웃 15초
  },

  // 글로벌 설정 - 테스트 전 환경 확인
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Auth Setup (1회 실행 — 5개 역할 browser-native 로그인 + storageState 저장)
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // Browser projects — setup 완료 후 실행
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      dependencies: ['setup'],
    },
  ],
  // webServer 설정 비활성화 - 수동으로 서버 실행 필요
  // 사용법: pnpm dev 실행 후 playwright test 실행
  // webServer: {
  //   command: 'npx next dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: true,
  //   timeout: 120 * 1000,
  // },
});
