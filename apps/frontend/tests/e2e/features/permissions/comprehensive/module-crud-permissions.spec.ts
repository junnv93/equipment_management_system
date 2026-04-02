/**
 * 역할별 권한 통합 E2E — 시나리오 6-7: 반출/NC 모듈 CRUD 권한
 *
 * 반출 상세 버튼 (CheckoutDetailClient.tsx):
 * - 승인/반려: TECHNICAL_MANAGER, LAB_MANAGER, SYSTEM_ADMIN + status=PENDING
 * - 반출 시작: 같은 역할 + status=APPROVED
 * - 반입 처리: 역할 무관 + status=CHECKED_OUT
 *
 * NC 상세 버튼 (NCDetailClient.tsx):
 * - 조치 완료: 모든 인증 사용자 + status=OPEN
 * - 종결 승인: can(Permission.CLOSE_NON_CONFORMANCE) (TM+) + status=CORRECTED
 * - 조치 반려: can(Permission.CLOSE_NON_CONFORMANCE) (TM+) + status=CORRECTED
 *
 * spec: apps/frontend/tests/e2e/features/permissions/comprehensive/role-permissions.plan.md
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { TEST_NC_IDS } from '../../../shared/constants/shared-test-data';
import { CHECKOUT_001_ID } from '../../../shared/constants/test-checkout-ids';

// Pending 상태 checkout (SSOT: test-checkout-ids.ts)
const PENDING_CHECKOUT_ID = CHECKOUT_001_ID;

test.describe('시나리오 6: 반출 모듈 권한', () => {
  test('TC-23: TE — 반출 상세에서 승인/반려 버튼 미표시', async ({ testOperatorPage: page }) => {
    await page.goto(`/checkouts/${PENDING_CHECKOUT_ID}`);
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    // TE는 APPROVE_CHECKOUT 권한 없음 — 승인/반려 버튼 미표시
    await expect(page.getByRole('button', { name: '승인', exact: true })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '반려', exact: true })).not.toBeVisible();
  });

  test('TC-24: TM — 반출 상세에서 승인/반려 버튼 표시', async ({ techManagerPage: page }) => {
    await page.goto(`/checkouts/${PENDING_CHECKOUT_ID}`);
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    // TM은 APPROVE_CHECKOUT 권한 있음
    await expect(page.getByRole('button', { name: '승인', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '반려', exact: true })).toBeVisible();
  });

  test('TC-25: QM — 반출 상세에서 승인/반려 버튼 미표시', async ({ qualityManagerPage: page }) => {
    await page.goto(`/checkouts/${PENDING_CHECKOUT_ID}`);
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    // QM은 APPROVE_CHECKOUT 권한 없음
    await expect(page.getByRole('button', { name: '승인', exact: true })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '반려', exact: true })).not.toBeVisible();
  });

  test('TC-26: LM — 반출 상세에서 승인/반려 버튼 표시', async ({ siteAdminPage: page }) => {
    await page.goto(`/checkouts/${PENDING_CHECKOUT_ID}`);
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    // LM은 APPROVE_CHECKOUT 권한 있음
    await expect(page.getByRole('button', { name: '승인', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '반려', exact: true })).toBeVisible();
  });
});

test.describe('시나리오 7: 부적합(NC) 모듈 권한', () => {
  // OPEN 상태의 NC (seed data: Suwon FCC EMC/RF team)
  const OPEN_NC_ID = TEST_NC_IDS.NC_001_MALFUNCTION_OPEN;

  test('TC-27: QM — NC 목록 접근 가능 (읽기전용)', async ({ qualityManagerPage: page }) => {
    await page.goto('/non-conformances');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    // QM은 VIEW 권한으로 목록 조회 가능
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });

  test('TC-28: NC 상세 — TE는 조치 완료 버튼 표시, 종결 승인/반려 미표시', async ({
    testOperatorPage: page,
  }) => {
    if (!OPEN_NC_ID) {
      test.skip();
      return;
    }
    await page.goto(`/non-conformances/${OPEN_NC_ID}`);
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    // TE는 OPEN 상태 NC에서 조치 완료 버튼 표시
    await expect(page.getByRole('button', { name: '조치 완료' })).toBeVisible();

    // TE는 CLOSE_NON_CONFORMANCE 권한 없으므로 종결 승인/반려 미표시
    await expect(page.getByRole('button', { name: '종결 승인' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '조치 반려' })).not.toBeVisible();
  });
});
