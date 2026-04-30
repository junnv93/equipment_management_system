// FSM Fail-Closed E2E Tests (Sprint 1.3 + 확장)
// meta.availableActions가 undefined일 때 UI 액션 버튼이 모두 hidden인지 검증.
// Sprint 1.3: ?? canApprove → ?? false 전환 (fail-closed 보안 패턴).
// 전략: page.route로 실제 응답 가로채기 후 meta 필드 제거/변형 반환.
// 시나리오 매트릭스 (20건):
//   FC-01~03: technical_manager x PENDING/non-action/terminal
//   FC-04~06: lab_manager x PENDING/non-action/terminal
//   FC-07~09: admin(system_admin) x PENDING/non-action/terminal
//   FC-10~12: test_engineer x PENDING(own)/PENDING(other)/non-pending
//   FC-13~14: 반려/quality_manager 회귀 방지
//   FC-15~16: availableActions 빈 객체/lab_manager 반입 승인
//   FC-17~18: explicit false (canApprove/canReturn)
//   FC-19~20: canBorrowerApprove/pagination 회귀

import path from 'path';
import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { CheckoutStatusValues as CSVal } from '@equipment-management/schemas';

const AUTH_DIR = path.join(__dirname, '../../../.auth');

// ─────────────────────────────────────────────────
// 헬퍼: route intercept — meta 필드 제거
// ─────────────────────────────────────────────────

type CheckoutLike = Record<string, unknown>;
type Page = Parameters<Parameters<(typeof test)['beforeEach']>[0]>[0];

async function routeStrippingMeta(page: Page, pattern = '**/api/checkouts**'): Promise<void> {
  await page.route(pattern, async (route) => {
    const response = await route.fetch();
    const json = (await response.json()) as { data?: CheckoutLike[]; [key: string]: unknown };
    if (json.data && Array.isArray(json.data)) {
      json.data = json.data.map(({ meta: _meta, ...rest }: CheckoutLike) => rest);
    }
    await route.fulfill({ json });
  });
}

/** meta는 유지하되 availableActions를 빈 객체로 교체 — FC-16용 */
async function routeWithEmptyActions(page: Page, pattern = '**/api/checkouts**'): Promise<void> {
  await page.route(pattern, async (route) => {
    const response = await route.fetch();
    const json = (await response.json()) as { data?: CheckoutLike[]; [key: string]: unknown };
    if (json.data && Array.isArray(json.data)) {
      json.data = json.data.map((checkout: CheckoutLike) => {
        const meta = (checkout.meta as Record<string, unknown>) ?? {};
        return { ...checkout, meta: { ...meta, availableActions: {} } };
      });
    }
    await route.fulfill({ json });
  });
}

/**
 * meta는 유지하되 availableActions의 특정 flag를 false로 교체 — FC-17/18용
 * PENDING 상태 항목에만 적용 (액션 버튼이 실제로 나타나는 상태).
 */
async function routeWithExplicitFalse(
  page: Page,
  flags: Partial<Record<string, boolean>>,
  pattern = '**/api/checkouts**'
): Promise<void> {
  await page.route(pattern, async (route) => {
    const response = await route.fetch();
    const json = (await response.json()) as { data?: CheckoutLike[]; [key: string]: unknown };
    if (json.data && Array.isArray(json.data)) {
      json.data = json.data.map((checkout: CheckoutLike) => {
        if ((checkout.status as string) !== CSVal.PENDING) return checkout;
        const meta = (checkout.meta as Record<string, unknown>) ?? {};
        const actions = ((meta.availableActions as Record<string, unknown>) ?? {}) as Record<
          string,
          unknown
        >;
        return {
          ...checkout,
          meta: { ...meta, availableActions: { ...actions, ...flags } },
        };
      });
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

// ─────────────────────────────────────────────────
// FC-13 ~ FC-14: 반려 버튼 + quality_manager 회귀
// ─────────────────────────────────────────────────

test.describe('FC: 반려 버튼 + quality_manager 회귀', () => {
  test('FC-13: technical_manager — meta없음 → 반려 버튼 hidden (canReject fail-closed)', async ({
    page,
  }) => {
    test.use({ storageState: path.join(AUTH_DIR, 'technical-manager.json') });
    await routeStrippingMeta(page);
    await page.goto('/checkouts');
    await page.waitForLoadState('domcontentloaded');

    // 반려 버튼 — 오버플로우 메뉴의 '반려' 항목도 canApproveItem 기반이므로 숨겨짐
    await expect(page.getByRole('button', { name: '반려' })).toBeHidden();
    await page.unroute('**/api/checkouts**');
  });

  test('FC-14: quality_manager — meta없음 → 승인 버튼 hidden (권한 없음 회귀 방지)', async ({
    page,
  }) => {
    test.use({ storageState: path.join(AUTH_DIR, 'quality-manager.json') });
    await routeStrippingMeta(page);
    await page.goto('/checkouts');
    await page.waitForLoadState('domcontentloaded');

    // quality_manager는 APPROVE_CHECKOUT 권한 없음 → fail-closed 전후 모두 hidden
    await expect(page.getByRole('button', { name: '승인' })).toBeHidden();
    await page.unroute('**/api/checkouts**');
  });
});

// ─────────────────────────────────────────────────
// FC-15 ~ FC-16: availableActions 변형 (empty object)
// ─────────────────────────────────────────────────

test.describe('FC: availableActions 변형', () => {
  test('FC-15: lab_manager — 완료 탭 + meta없음 → 반입 승인 없음', async ({ page }) => {
    test.use({ storageState: path.join(AUTH_DIR, 'lab-manager.json') });
    await routeStrippingMeta(page);
    await page.goto('/checkouts?subTab=completed');
    await page.waitForLoadState('domcontentloaded');

    // 반입 승인 버튼 — canApproveReturn ?? false → meta없으면 없음
    await expect(page.getByRole('button', { name: /반입 승인/ })).toBeHidden();
    await page.unroute('**/api/checkouts**');
  });

  test('FC-16: system_admin — availableActions: {} (빈 객체) → 승인 버튼 hidden', async ({
    page,
  }) => {
    test.use({ storageState: path.join(AUTH_DIR, 'system-admin.json') });
    await routeWithEmptyActions(page);
    await page.goto('/checkouts');
    await page.waitForLoadState('domcontentloaded');

    // meta는 있지만 availableActions가 {} → canApprove 키 자체 없음 → ?? false → hidden
    await expect(page.getByRole('button', { name: '승인' })).toBeHidden();
    await page.unroute('**/api/checkouts**');
  });
});

// ─────────────────────────────────────────────────
// FC-17 ~ FC-18: explicit false (meta 있고 명시적 false)
// meta가 존재하지만 특정 flag가 명시적으로 false인 경우
// ─────────────────────────────────────────────────

test.describe('FC: explicit false in availableActions', () => {
  test.use({ storageState: path.join(AUTH_DIR, 'technical-manager.json') });

  test('FC-17: canApprove: false explicit → 승인 버튼 hidden', async ({ page }) => {
    await routeWithExplicitFalse(page, { canApprove: false });
    await page.goto('/checkouts');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('button', { name: '승인' })).toBeHidden();
    await page.unroute('**/api/checkouts**');
  });

  test('FC-18: canReturn: false explicit → 반입 처리 링크 hidden', async ({ page }) => {
    await routeWithExplicitFalse(page, { canReturn: false });
    await page.goto('/checkouts');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('link', { name: /반입 처리/ })).toBeHidden();
    await page.unroute('**/api/checkouts**');
  });
});

// ─────────────────────────────────────────────────
// FC-19 ~ FC-20: canBorrowerApprove + pagination 회귀
// ─────────────────────────────────────────────────

test.describe('FC: canBorrowerApprove + pagination 회귀', () => {
  test('FC-19: test_engineer — 렌탈 필터 + meta없음 → 1차 승인 hidden (canBorrowerApprove)', async ({
    page,
  }) => {
    test.use({ storageState: path.join(AUTH_DIR, 'test-engineer.json') });
    await routeStrippingMeta(page);
    await page.goto('/checkouts?purpose=rental');
    await page.waitForLoadState('domcontentloaded');

    // 렌탈 1차 승인 버튼 — canBorrowerApprove ?? false → meta없으면 hidden
    await expect(page.getByRole('button', { name: /1차 승인/ })).toBeHidden();
    await page.unroute('**/api/checkouts**');
  });

  test('FC-20: technical_manager — page=2 이동 후 meta없음 → 승인 버튼 없음 (회귀)', async ({
    page,
  }) => {
    test.use({ storageState: path.join(AUTH_DIR, 'technical-manager.json') });
    await routeStrippingMeta(page);
    await page.goto('/checkouts?page=2');
    await page.waitForLoadState('domcontentloaded');

    // 페이지네이션 후에도 fail-closed 유지 — meta없으면 승인 없음
    await expect(page.getByRole('button', { name: '승인' })).toBeHidden();
    await page.unroute('**/api/checkouts**');
  });
});
