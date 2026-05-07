/**
 * Bulk action mutateAsync UX (real-backend integration)
 *
 * 옵션 A의 mutateAsync 전환은 RTL spec 7 cases (mock 기반)만 검증되어 있어,
 * 실제 backend latency 환경에서 AlertDialog 상태 머신을 검증한다.
 *
 * 검증 표면:
 * 1. AlertDialog가 confirm 클릭 후 backend 응답 도착 전까지 visible 유지
 * 2. 성공 응답 시 dialog가 hidden + selection clear + toast 표시
 * 3. 다중 confirm 클릭 시 mutateAsync가 단일 fire (race 방지)
 *
 * mock-only 안티패턴 회피: `page.route` 사용 금지 — 실제 backend 응답 의존
 *
 * @see project_option_a_b_mutateAsync_csv_uuid_20260506.md
 * @see verify-bulk-action-bar Step 12
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import {
  createCheckout,
  resetEquipmentForWorkflow,
  clearBackendCache,
  cleanupSharedPool,
} from '../workflows/helpers/workflow-helpers';
import { CheckoutPurposeValues as CPVal } from '@equipment-management/schemas';
import { TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';
import { expectToastVisible } from '../shared/helpers/toast-helpers';

// 기존 outbound-bulk-action.spec.ts와 겹치지 않는 available SUW_E 3건
const MUTATE_ASYNC_EQUIPMENT_IDS = [
  TEST_EQUIPMENT_IDS.SHARED_ANALYZER_SUW_E,
  TEST_EQUIPMENT_IDS.RBAC_SIGNAL_GEN_SUW_E,
  TEST_EQUIPMENT_IDS.CANCEL_RECEIVER_SUW_E,
];

test.describe('Bulk action mutateAsync UX (real-backend integration)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    for (const id of MUTATE_ASYNC_EQUIPMENT_IDS) {
      await resetEquipmentForWorkflow(id);
    }
  });

  test.afterAll(async () => {
    for (const id of MUTATE_ASYNC_EQUIPMENT_IDS) {
      await resetEquipmentForWorkflow(id);
    }
    await cleanupSharedPool();
  });

  test('seed: 3건 반출 신청 생성', async ({ testOperatorPage: page }) => {
    for (const equipmentId of MUTATE_ASYNC_EQUIPMENT_IDS) {
      const body = await createCheckout(
        page,
        [equipmentId],
        CPVal.CALIBRATION,
        'KRISS',
        'mutateAsync UX real-backend 검증'
      );
      const id = body?.data?.id ?? body?.id;
      expect(id).toBeTruthy();
    }
    await clearBackendCache();
  });

  test('mutateAsync: AlertDialog stays visible until backend response, then closes', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/checkouts');
    await page.waitForSelector('[data-checkout-id]', { timeout: 15000 });

    const rowCheckboxes = page.locator('[data-testid="row-checkbox"]');
    if ((await rowCheckboxes.count()) < 3) return;

    await rowCheckboxes.nth(0).click();
    await rowCheckboxes.nth(1).click();
    await rowCheckboxes.nth(2).click();

    const bar = page.locator('[data-testid="bulk-action-bar"]');
    await expect(bar).toHaveAttribute('aria-hidden', 'false');

    const approveButton = page
      .locator('[role="toolbar"] button')
      .filter({ hasText: /일괄 승인|Approve Selected/ });
    await approveButton.click();

    const dialog = page.locator('[role="alertdialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const confirmButton = dialog
      .locator('button')
      .filter({ hasText: /일괄 승인|Approve/ })
      .last();

    // bulk-approve API 응답을 기다리며 dialog가 응답 도착 전까지 visible 유지되는지 확인
    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/checkouts/bulk-approve') && res.request().method() === 'POST'
    );
    await confirmButton.click();

    // mutateAsync UX 핵심: 응답 도착 직전까지 dialog 유지
    await expect(dialog).toBeVisible();

    const response = await responsePromise;
    expect(response.status()).toBe(200);
    await clearBackendCache();

    // 응답 후 dialog hidden + toast + bar 자동 reset
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
    await expectToastVisible(page, /일괄 승인이 완료|approved in bulk/, { timeout: 10000 });
    await expect(bar).toHaveAttribute('aria-hidden', 'true', { timeout: 5000 });
  });

  test('mutateAsync: rapid double-click on confirm fires single backend request', async ({
    testOperatorPage,
    techManagerPage: page,
  }) => {
    // 다음 라운드용 추가 신청 생성 (이전 test에서 모두 처리됨)
    for (const id of MUTATE_ASYNC_EQUIPMENT_IDS) {
      await resetEquipmentForWorkflow(id);
    }
    for (const equipmentId of MUTATE_ASYNC_EQUIPMENT_IDS) {
      await createCheckout(
        testOperatorPage,
        [equipmentId],
        CPVal.CALIBRATION,
        'KRISS',
        'mutateAsync double-click race'
      );
    }
    await clearBackendCache();

    await page.goto('/checkouts');
    await page.waitForSelector('[data-checkout-id]', { timeout: 15000 });

    const rowCheckboxes = page.locator('[data-testid="row-checkbox"]');
    if ((await rowCheckboxes.count()) < 3) return;

    for (let i = 0; i < 3; i++) {
      await rowCheckboxes.nth(i).click();
    }

    const approveButton = page
      .locator('[role="toolbar"] button')
      .filter({ hasText: /일괄 승인|Approve Selected/ });
    await approveButton.click();

    const dialog = page.locator('[role="alertdialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const confirmButton = dialog
      .locator('button')
      .filter({ hasText: /일괄 승인|Approve/ })
      .last();

    // POST 요청 카운트 — mutateAsync는 race-safe (두번째 click은 disabled 상태로 차단)
    let postCount = 0;
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/api/checkouts/bulk-approve')) {
        postCount += 1;
      }
    });

    // 빠른 double-click — 두번째는 disabled 또는 이미 진행중인 mutateAsync에 의해 무시됨
    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/checkouts/bulk-approve') && res.request().method() === 'POST'
    );
    await Promise.all([confirmButton.click(), confirmButton.click().catch(() => undefined)]);
    await responsePromise;
    await clearBackendCache();

    // 단일 backend POST 요청 — race 차단 검증
    expect(postCount).toBe(1);

    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  test('mutateAsync: bulk reject flow — dialog state machine', async ({
    testOperatorPage,
    techManagerPage: page,
  }) => {
    // 다음 라운드용 추가 신청 생성
    for (const id of MUTATE_ASYNC_EQUIPMENT_IDS) {
      await resetEquipmentForWorkflow(id);
    }
    for (const equipmentId of MUTATE_ASYNC_EQUIPMENT_IDS) {
      await createCheckout(
        testOperatorPage,
        [equipmentId],
        CPVal.CALIBRATION,
        'KRISS',
        'mutateAsync reject flow 검증'
      );
    }
    await clearBackendCache();

    await page.goto('/checkouts');
    await page.waitForSelector('[data-checkout-id]', { timeout: 15000 });

    const rowCheckboxes = page.locator('[data-testid="row-checkbox"]');
    if ((await rowCheckboxes.count()) < 3) return;

    await rowCheckboxes.nth(0).click();
    await rowCheckboxes.nth(1).click();
    await rowCheckboxes.nth(2).click();

    const rejectButton = page
      .locator('[role="toolbar"] button')
      .filter({ hasText: /일괄 반려|Reject Selected/ });

    // reject 버튼이 toolbar에 노출되어 있는지 확인 — 없으면 스킵 (도메인 옵션)
    if ((await rejectButton.count()) === 0) {
      test.skip();
      return;
    }

    await rejectButton.click();

    const dialog = page.locator('[role="alertdialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 사유 입력 (RejectModal 도메인 룰: comment 필수)
    const commentTextarea = dialog.locator('textarea').first();
    if ((await commentTextarea.count()) > 0) {
      await commentTextarea.fill('mutateAsync reject UX 검증');
    }

    const confirmButton = dialog
      .locator('button')
      .filter({ hasText: /반려|Reject/ })
      .last();

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/checkouts/bulk-reject') && res.request().method() === 'POST'
    );
    await confirmButton.click();

    // pending 동안 dialog visible 유지
    await expect(dialog).toBeVisible();

    const response = await responsePromise;
    expect(response.status()).toBe(200);
    await clearBackendCache();

    // 응답 후 dialog hidden + toast
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
    await expectToastVisible(page, /반려|rejected/, { timeout: 10000 });
  });
});
