/**
 * Playwright E2E 테스트용 인증 픽스처 (storageState 기반)
 *
 * auth.setup.ts (setup project)가 생성한 storageState 파일을 사용하여
 * 역할별 인증된 브라우저 컨텍스트를 제공합니다.
 *
 * ## 아키텍처
 *
 * 1. auth.setup.ts: browser-native 로그인 → storageState 파일 저장 (1회)
 * 2. auth.fixture.ts (이 파일): storageState 파일 로드 → 인증된 Page 제공 (테스트당)
 *
 * ## 사용 예
 *
 * ```typescript
 * import { test, expect } from '../../shared/fixtures/auth.fixture';
 *
 * test('시험실무자는 장비 목록을 볼 수 있다', async ({ testOperatorPage }) => {
 *   await testOperatorPage.goto('/equipment');
 *   await expect(testOperatorPage.locator('h1')).toContainText('장비 목록');
 * });
 * ```
 *
 * ## 장점 (기존 loginAs() 방식 대비)
 *
 * - Zero cookie parsing: 브라우저가 Set-Cookie를 자체 처리
 * - Zero per-test login overhead: storageState 로드 ~30ms (vs loginAs ~2초)
 * - 결정적 동작: waitForURL 기반 (waitForTimeout 제거)
 */

import { test as base, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const AUTH_DIR = path.join(__dirname, '../../.auth');

/** 역할별 storageState 파일 경로 */
const STORAGE_STATE = {
  test_engineer: path.join(AUTH_DIR, 'test-engineer.json'),
  technical_manager: path.join(AUTH_DIR, 'technical-manager.json'),
  quality_manager: path.join(AUTH_DIR, 'quality-manager.json'),
  lab_manager: path.join(AUTH_DIR, 'lab-manager.json'),
  system_admin: path.join(AUTH_DIR, 'system-admin.json'),
} as const;

/**
 * 역할별 페이지 픽스처 인터페이스
 */
interface AuthFixtures {
  testOperatorPage: Page; // 시험실무자
  techManagerPage: Page; // 기술책임자
  qualityManagerPage: Page; // 품질책임자 (3단계 승인 - 검토)
  siteAdminPage: Page; // 시험소 관리자
  systemAdminPage: Page; // 시스템 관리자
}

/**
 * storageState 파일에서 인증된 브라우저 컨텍스트 + 페이지 생성
 *
 * @param browser - Playwright Browser 인스턴스
 * @param storageStatePath - auth.setup.ts가 생성한 storageState JSON 경로
 * @returns { context, page } — 테스트 후 context.close() 필요
 */
async function createAuthenticatedPage(
  browser: import('@playwright/test').Browser,
  storageStatePath: string
) {
  if (!fs.existsSync(storageStatePath)) {
    throw new Error(
      `[Auth Fixture] storageState 파일 없음: ${storageStatePath}\n` +
        `Setup project가 실행되지 않았습니다.\n` +
        `실행: npx playwright test --project=setup`
    );
  }
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
  const context = await browser.newContext({ baseURL, storageState: storageStatePath });
  const page = await context.newPage();
  return { context, page };
}

/**
 * 역할별 인증 픽스처
 *
 * 각 테스트는 독립적인 브라우저 컨텍스트에서 실행됩니다.
 * storageState를 통해 인증 상태가 주입되므로 네트워크 로그인이 불필요합니다.
 */
export const test = base.extend<AuthFixtures>({
  /** 시험실무자 (Test Engineer) — 장비 운영, 점검, 이력카드 작성 */
  testOperatorPage: async ({ browser }, use) => {
    const { context, page } = await createAuthenticatedPage(browser, STORAGE_STATE.test_engineer);
    await use(page);
    await context.close();
  },

  /** 기술책임자 (Technical Manager) — 교정계획, 반출입 승인, 보정인자 관리 */
  techManagerPage: async ({ browser }, use) => {
    const { context, page } = await createAuthenticatedPage(
      browser,
      STORAGE_STATE.technical_manager
    );
    await use(page);
    await context.close();
  },

  /** 품질책임자 (Quality Manager) — 교정계획서 검토 (3단계 승인) */
  qualityManagerPage: async ({ browser }, use) => {
    const { context, page } = await createAuthenticatedPage(browser, STORAGE_STATE.quality_manager);
    await use(page);
    await context.close();
  },

  /** 시험소 관리자 (Lab Manager) — 교정계획 승인, 장비 폐기 승인 */
  siteAdminPage: async ({ browser }, use) => {
    const { context, page } = await createAuthenticatedPage(browser, STORAGE_STATE.lab_manager);
    await use(page);
    await context.close();
  },

  /** 시스템 관리자 (System Admin) — 전체 시스템, 모든 시험소 접근 */
  systemAdminPage: async ({ browser }, use) => {
    const { context, page } = await createAuthenticatedPage(browser, STORAGE_STATE.system_admin);
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
export type { Page } from '@playwright/test';
