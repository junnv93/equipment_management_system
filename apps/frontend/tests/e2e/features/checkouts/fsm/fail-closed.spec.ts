// FSM Fail-Closed E2E Tests (Sprint 1.3)
// meta.availableActions가 undefined일 때 UI 액션 버튼이 모두 hidden인지 검증.
// Sprint 1.3: ?? canApprove → ?? false 전환 (fail-closed 보안 패턴).
// 전략: page.route로 실제 응답 가로채기 후 meta 필드 제거 반환.
// 시나리오 매트릭스 (12건):
//   FC-01~03: technical_manager x PENDING/non-action/terminal
//   FC-04~06: lab_manager x PENDING/non-action/terminal
//   FC-07~09: admin(system_admin) x PENDING/non-action/terminal
//   FC-10~12: test_engineer x PENDING(own)/PENDING(other)/non-pending

import path from 'path';
import { test, expect } from '../../../shared/fixtures/auth.fixture';

const AUTH_DIR = path.join(__dirname, '../../../.auth');

// ─────────────────────────────────────────────────
// 헬퍼: route intercept — meta 필드 제거
// ─────────────────────────────────────────────────

type CheckoutLike = Record<string, unknown>;

async function routeStrippingMeta(
  page: Parameters<Parameters<(typeof test)['beforeEach']>[0]>[0],
  pattern = '**/api/checkouts**'
): Promise<void> {
  await page.route(pattern, async (route) => {
    const response = await route.fetch();
    const json = (await response.json()) as {
      data?: CheckoutLike[];
      [key: string]: unknown;
    };

    if (json.data && Array.isArray(json.data)) {
      json.data = json.data.map(({ meta: _meta, ...rest }: CheckoutLike) => rest);
    }

    await route.fulfill({ json });
  });
}

// ─────────────────────────────────────────────────
// FC-01 ~ FC-03: technical_manager
// APPROVE_CHECKOUT 권한 보유 → canApprove prop = true
// meta 제거 시 inline 승인 버튼 hidden이 핵심 검증
// ─────────────────────────────────────────────────

test.describe('FC: technical_manager — fail-closed', () => {
  test.use({ storageState: path.join(AUTH_DIR, 'technical-manager.json') });

  test('FC-01: PENDING + meta 없음 → 인라인 승인 버튼 hidden', async ({ page }) => {
    await routeStrippingMeta(page);
    await page.goto('/checkouts');
    await page.waitForLoadState('domcontentloaded');

    // 인라인 승인 버튼 — CheckoutGroupCard row 내부 Button('승인')
    await expect(page.getByRole('button', { name: '승인' })).toBeHidden();
    await page.unroute('**/api/checkouts**');
  });

  test('FC-02: CHECKED_OUT/OVERDUE + meta 없음 → 반입 처리 링크 hidden', async ({ page }) => {
    await routeStrippingMeta(page);
    await page.goto('/checkouts');
    await page.waitForLoadState('domcontentloaded');

    // processReturn Link — canReturn ?? false → meta 없으면 hidden
    await expect(page.getByRole('link', { name: /반입 처리/ })).toBeHidden();
    await page.unroute('**/api/checkouts**');
  });

  test('FC-03: RETURNED(terminal) + meta 없음 → 승인 버튼 없음', async ({ page }) => {
    await routeStrippingMeta(page);
    // 완료 탭: returned / return_approved 상태
    await page.goto('/checkouts?subTab=completed');
    await page.waitForLoadState('domcontentloaded');

    // terminal 상태 — 승인 버튼이 처음부터 없어야 함
    await expect(page.getByRole('button', { name: '승인' })).toBeHidden();
    await page.unroute('**/api/checkouts**');
  });
});

// ─────────────────────────────────────────────────
// FC-04 ~ FC-06: lab_manager (siteAdminPage)
// ─────────────────────────────────────────────────

test.describe('FC: lab_manager — fail-closed', () => {
  test.use({ storageState: path.join(AUTH_DIR, 'lab-manager.json') });

  test('FC-04: PENDING + meta 없음 → 인라인 승인 버튼 hidden', async ({ page }) => {
    await routeStrippingMeta(page);
    await page.goto('/checkouts');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('button', { name: '승인' })).toBeHidden();
    await page.unroute('**/api/checkouts**');
  });

  test('FC-05: PENDING + meta 없음 → 일괄 승인 버튼 hidden', async ({ page }) => {
    await routeStrippingMeta(page);
    await page.goto('/checkouts');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('button', { name: /전체 승인/ })).toBeHidden();
    await page.unroute('**/api/checkouts**');
  });

  test('FC-06: REJECTED(terminal) + meta 없음 → 승인 버튼 없음', async ({ page }) => {
    await routeStrippingMeta(page);
    await page.goto('/checkouts?subTab=completed');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('button', { name: '승인' })).toBeHidden();
    await page.unroute('**/api/checkouts**');
  });
});

// ─────────────────────────────────────────────────
// FC-07 ~ FC-09: system_admin
// 모든 사이트 접근 가능 — 가장 광범위한 권한 보유
// ─────────────────────────────────────────────────

test.describe('FC: system_admin — fail-closed', () => {
  test.use({ storageState: path.join(AUTH_DIR, 'system-admin.json') });

  test('FC-07: PENDING + meta 없음 → 인라인 승인 버튼 hidden (admin도 fallback 금지)', async ({
    page,
  }) => {
    await routeStrippingMeta(page);
    await page.goto('/checkouts');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('button', { name: '승인' })).toBeHidden();
    await page.unroute('**/api/checkouts**');
  });

  test('FC-08: PENDING + meta 없음 → 일괄 승인 버튼 hidden', async ({ page }) => {
    await routeStrippingMeta(page);
    await page.goto('/checkouts');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('button', { name: /전체 승인/ })).toBeHidden();
    await page.unroute('**/api/checkouts**');
  });

  test('FC-09: OVERDUE + meta 없음 → 반입 처리 링크 hidden (admin도 fallback 금지)', async ({
    page,
  }) => {
    await routeStrippingMeta(page);
    await page.goto('/checkouts');
    await page.waitForLoadState('domcontentloaded');

    // OVERDUE 항목의 processReturn Link도 canReturn ?? false로 제어
    await expect(page.getByRole('link', { name: /반입 처리/ })).toBeHidden();
    await page.unroute('**/api/checkouts**');
  });
});

// ─────────────────────────────────────────────────
// FC-10 ~ FC-12: test_engineer
// APPROVE_CHECKOUT 권한 없음 → canApprove prop = false
// fail-closed 변경 전에도 동일 동작 — 회귀 방지 목적
// ─────────────────────────────────────────────────

test.describe('FC: test_engineer — fail-closed 회귀 방지', () => {
  test.use({ storageState: path.join(AUTH_DIR, 'test-engineer.json') });

  test('FC-10: PENDING(own) + meta 없음 → 승인 버튼 hidden (test_engineer 원래 권한 없음)', async ({
    page,
  }) => {
    await routeStrippingMeta(page);
    await page.goto('/checkouts');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('button', { name: '승인' })).toBeHidden();
    await page.unroute('**/api/checkouts**');
  });

  test('FC-11: PENDING(other user) + meta 없음 → 승인 버튼 hidden', async ({ page }) => {
    await routeStrippingMeta(page);
    // scope=all 로 다른 사용자 반출도 포함
    await page.goto('/checkouts?scope=all');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('button', { name: '승인' })).toBeHidden();
    await page.unroute('**/api/checkouts**');
  });

  test('FC-12: 빈 meta 응답 + 전 상태 → 일괄 승인 버튼 hidden', async ({ page }) => {
    await routeStrippingMeta(page);
    await page.goto('/checkouts');
    await page.waitForLoadState('domcontentloaded');

    // 일괄 승인은 test_engineer도 canApprove=false이므로 원래 안 나오지만 회귀 방지
    await expect(page.getByRole('button', { name: /전체 승인/ })).toBeHidden();
    await page.unroute('**/api/checkouts**');
  });
});
