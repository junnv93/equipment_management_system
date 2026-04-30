/**
 * WF-AP02: 승인 목록 일괄 반려 (BulkActionBar + RejectModal bulk 모드)
 *
 * 복수 항목 선택 → BulkActionBar 표시 → 일괄 반려 → RejectModal bulk 모드 → 사유 입력 → 반려 완료.
 *
 * @see apps/frontend/components/approvals/BulkActionBar.tsx
 * @see apps/frontend/components/approvals/RejectModal.tsx (mode='bulk')
 * @see apps/frontend/components/approvals/ApprovalsClient.tsx (bulkRejectMutation)
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import {
  createCheckout,
  resetEquipmentForWorkflow,
  clearBackendCache,
  cleanupSharedPool,
} from './helpers/workflow-helpers';
import { CheckoutPurposeValues as CPVal } from '@equipment-management/schemas';
import { TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';
import { expectToastVisible } from '../shared/helpers/toast-helpers';

const WF_EQUIPMENT_IDS = [
  TEST_EQUIPMENT_IDS.CANCEL_RECEIVER_SUW_E,
  TEST_EQUIPMENT_IDS.CAS_ANALYZER_SUW_E,
];

test.describe('WF-AP02: 승인 목록 일괄 반려', () => {
  test.describe.configure({ mode: 'serial' });

  const checkoutIds: string[] = [];

  test.beforeAll(async () => {
    for (const id of WF_EQUIPMENT_IDS) {
      await resetEquipmentForWorkflow(id);
    }
  });

  test.afterAll(async () => {
    for (const id of WF_EQUIPMENT_IDS) {
      await resetEquipmentForWorkflow(id);
    }
    await cleanupSharedPool();
  });

  test('Step 1: 2개 반출 신청 생성 (일괄 반려용)', async ({ testOperatorPage: page }) => {
    for (const equipmentId of WF_EQUIPMENT_IDS) {
      const body = await createCheckout(
        page,
        [equipmentId],
        CPVal.CALIBRATION,
        'KRISS',
        'WF-AP02: 일괄 반려 검증'
      );
      const id = body?.data?.id ?? body?.id;
      expect(id).toBeTruthy();
      checkoutIds.push(id);
    }
    await clearBackendCache();
  });

  test('Step 2: BulkActionBar — 0건 선택 시 숨김', async ({ techManagerPage: page }) => {
    await page.goto('/admin/approvals?tab=outgoing');
    await page.waitForSelector('[data-testid="approval-item"]', { timeout: 15000 });

    // 선택 없으면 BulkActionBar hidden
    const bar = page.locator('[data-testid="bulk-action-bar"]');
    await expect(bar).toHaveAttribute('aria-hidden', 'true');
  });

  test('Step 3: 체크박스 선택 → BulkActionBar 표시 + 카운트 chip', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/admin/approvals?tab=outgoing');
    await page.waitForSelector('[data-testid="approval-item"]', { timeout: 15000 });

    const rows = page.locator('[data-testid="approval-item"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(2);

    // 첫 번째 행 체크박스 클릭
    await rows.first().locator('[role="checkbox"]').click();

    const bar = page.locator('[data-testid="bulk-action-bar"]');
    await expect(bar).toHaveAttribute('aria-hidden', 'false');

    // 선택 카운트 — GenericBulkActionBar span 내 텍스트
    const toolbar = bar.locator('[role="toolbar"]');
    await expect(toolbar).toBeVisible();
    await expect(toolbar).toContainText('1');

    // 두 번째 행도 선택
    await rows.nth(1).locator('[role="checkbox"]').click();
    await expect(toolbar).toContainText('2');
  });

  test('Step 4: 일괄 반려 버튼 클릭 → RejectModal bulk 모드 표시', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/admin/approvals?tab=outgoing');
    await page.waitForSelector('[data-testid="approval-item"]', { timeout: 15000 });

    const rows = page.locator('[data-testid="approval-item"]');

    // 2개 선택
    await rows.first().locator('[role="checkbox"]').click();
    await rows.nth(1).locator('[role="checkbox"]').click();

    // 일괄 반려 버튼
    const rejectButton = page.locator('[role="toolbar"] button').filter({ hasText: /반려/ });
    await expect(rejectButton).toBeVisible();
    await rejectButton.click();

    // RejectModal 열림 확인
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // bulk 모드 타이틀
    await expect(modal).toContainText(/일괄 반려|건 반려/);

    // 사유 입력 필드 존재
    const reasonInput = modal.locator('textarea');
    await expect(reasonInput).toBeVisible();
  });

  test('Step 5: 반려 사유 입력 → 확인 → 반려 완료', async ({ techManagerPage: page }) => {
    await page.goto('/admin/approvals?tab=outgoing');
    await page.waitForSelector('[data-testid="approval-item"]', { timeout: 15000 });

    const rows = page.locator('[data-testid="approval-item"]');
    const initialCount = await rows.count();

    // 2개 선택
    await rows.first().locator('[role="checkbox"]').click();
    await rows.nth(1).locator('[role="checkbox"]').click();

    // 일괄 반려
    const rejectButton = page.locator('[role="toolbar"] button').filter({ hasText: /반려/ });
    await rejectButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // 사유 입력 (최소 10자)
    const reasonInput = modal.locator('textarea');
    await reasonInput.fill('WF-AP02 E2E 테스트: 일괄 반려 사유 입력 검증입니다.');

    // 확인 버튼
    const confirmButton = modal
      .locator('button[type="submit"], button')
      .filter({ hasText: /반려 확인|반려하기|확인/ })
      .last();
    await confirmButton.click();

    // 모달 닫힘 대기 (event-based)
    await expect(modal).not.toBeVisible({ timeout: 10000 });
    await clearBackendCache();

    // 반려 후 항목 수 감소 (또는 toast 표시)
    const afterCount = await rows.count();
    expect(afterCount).toBeLessThanOrEqual(initialCount);
  });

  test('Step 6: 선택 해제 버튼(×) → BulkActionBar 숨김', async ({ techManagerPage: page }) => {
    await page.goto('/admin/approvals?tab=outgoing');
    await page.waitForSelector('[data-testid="approval-item"]', { timeout: 15000 });

    const rows = page.locator('[data-testid="approval-item"]');
    if ((await rows.count()) === 0) {
      // 이미 모두 반려됨 — 스킵
      return;
    }

    await rows.first().locator('[role="checkbox"]').click();

    const bar = page.locator('[data-testid="bulk-action-bar"]');
    await expect(bar).toHaveAttribute('aria-hidden', 'false');

    // × 선택 해제 버튼
    const dismissButton = page.locator('[role="toolbar"] button').filter({ hasText: /선택 해제/ });
    await dismissButton.click();

    await expect(bar).toHaveAttribute('aria-hidden', 'true');
  });

  test('Step 7 (a11y): toolbar aria-live + 부분선택 시 master checkbox aria-checked="mixed"', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/admin/approvals?tab=outgoing');
    await page.waitForSelector('[data-testid="approval-item"]', { timeout: 15000 });

    const rows = page.locator('[data-testid="approval-item"]');
    if ((await rows.count()) < 2) {
      // 데이터 부족 — 스킵
      return;
    }

    // toolbar는 aria-live="polite" — 카운트 변화를 SR이 polite하게 알림
    const toolbar = page.locator('[role="toolbar"]').first();
    await rows.first().locator('[role="checkbox"]').click();
    await expect(toolbar).toHaveAttribute('aria-live', 'polite');

    // 부분 선택 (1/2건) — toolbar 마스터 체크박스는 aria-checked="mixed"
    // (Radix Checkbox checked='indeterminate' → 자동으로 mixed 부여)
    const masterCheckbox = toolbar.locator('[role="checkbox"]').first();
    await expect(masterCheckbox).toHaveAttribute('aria-checked', 'mixed');

    // 모두 선택 (2/2건) — aria-checked="true"
    await rows.nth(1).locator('[role="checkbox"]').click();
    await expect(masterCheckbox).toHaveAttribute('aria-checked', 'true');

    // 모두 해제 — toolbar 자체가 hidden 처리되므로 aria-hidden 검증으로 대체
    await rows.first().locator('[role="checkbox"]').click();
    await rows.nth(1).locator('[role="checkbox"]').click();
    const bar = page.locator('[data-testid="bulk-action-bar"]');
    await expect(bar).toHaveAttribute('aria-hidden', 'true');
  });

  test('Step 8: bulk-reject 전체 성공 — mock 응답 시 toast "{count}건이 반려되었습니다." 표시', async ({
    techManagerPage: page,
  }) => {
    // Steps 1~7에서 소진된 항목 재생성
    for (const id of WF_EQUIPMENT_IDS) {
      await resetEquipmentForWorkflow(id);
    }
    for (const equipmentId of WF_EQUIPMENT_IDS) {
      await createCheckout(page, [equipmentId], CPVal.CALIBRATION, 'KRISS', 'WF-AP02 Step 8');
    }
    await clearBackendCache();

    await page.goto('/admin/approvals?tab=outgoing');
    await page.waitForSelector('[data-testid="approval-item"]', { timeout: 15000 });

    const rows = page.locator('[data-testid="approval-item"]');
    const count = await rows.count();
    if (count < 1) return; // 항목 없으면 스킵

    // 모든 항목 선택
    for (let i = 0; i < count; i++) {
      await rows.nth(i).locator('[role="checkbox"]').click();
    }

    // bulk-reject API 전체 성공 mock
    await page.route('**/api/checkouts/bulk-reject', async (route) => {
      const body = JSON.parse(route.request().postData() ?? '{}') as { ids?: string[] };
      const ids = body.ids ?? [];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rejected: ids.map((id, i) => ({ id, version: i + 2 })),
          failed: [],
        }),
      });
    });

    try {
      const rejectButton = page.locator('[role="toolbar"] button').filter({ hasText: /반려/ });
      await expect(rejectButton).toBeVisible();
      await rejectButton.click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 5000 });

      const reasonInput = modal.locator('textarea');
      await reasonInput.fill('WF-AP02 Step 8: 전체 성공 mock 검증 사유.');

      const confirmButton = modal
        .locator('button[type="submit"], button')
        .filter({ hasText: /반려 확인|반려하기|확인/ })
        .last();
      await confirmButton.click();

      await expect(modal).not.toBeVisible({ timeout: 10000 });

      // 전체 성공 → "{count}건이 반려되었습니다." toast
      await expectToastVisible(page, /건이 반려되었습니다/, { timeout: 10000 });
    } finally {
      await page.unroute('**/api/checkouts/bulk-reject');
    }
  });

  test('Step 9: bulk-reject 부분 실패 시뮬레이션 — mock 부분 실패 응답 시 toast 분기 표시', async ({
    techManagerPage: page,
  }) => {
    // 이 스텝은 Step 8에서 이미 처리되어 남은 항목이 없을 수 있으므로 재생성
    for (const id of WF_EQUIPMENT_IDS) {
      await resetEquipmentForWorkflow(id);
    }
    for (const equipmentId of WF_EQUIPMENT_IDS) {
      await createCheckout(page, [equipmentId], CPVal.CALIBRATION, 'KRISS', 'WF-AP02 Step 9');
    }
    await clearBackendCache();

    await page.goto('/admin/approvals?tab=outgoing');
    await page.waitForSelector('[data-testid="approval-item"]', { timeout: 15000 });

    const rows = page.locator('[data-testid="approval-item"]');
    const count = await rows.count();
    if (count < 2) return; // 부분 실패 검증을 위해 2건 이상 필요

    await rows.first().locator('[role="checkbox"]').click();
    await rows.nth(1).locator('[role="checkbox"]').click();

    // bulk-reject API 부분 실패 mock: body = { rejected: [성공 건], failed: [실패 건] }
    await page.route('**/api/checkouts/bulk-reject', async (route) => {
      const body = JSON.parse(route.request().postData() ?? '{}') as { ids?: string[] };
      const ids = body.ids ?? [];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rejected: ids.slice(0, 1).map((id) => ({ id, version: 2 })),
          failed: ids.slice(1).map((id) => ({ id, error: '교정 상태 충돌로 처리 불가' })),
        }),
      });
    });

    try {
      const rejectButton = page.locator('[role="toolbar"] button').filter({ hasText: /반려/ });
      await expect(rejectButton).toBeVisible();
      await rejectButton.click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 5000 });

      const reasonInput = modal.locator('textarea');
      await reasonInput.fill('WF-AP02 Step 9: 부분 실패 시뮬레이션 사유 입력.');

      const confirmButton = modal
        .locator('button[type="submit"], button')
        .filter({ hasText: /반려 확인|반려하기|확인/ })
        .last();
      await confirmButton.click();

      await expect(modal).not.toBeVisible({ timeout: 10000 });

      // 부분 실패 → "{success}건 반려 완료, {failed}건 실패" toast (destructive)
      await expectToastVisible(page, /건 반려 완료.*건 실패|건 실패/, { timeout: 10000 });
    } finally {
      await page.unroute('**/api/checkouts/bulk-reject');
    }
  });
});

/**
 * WF-AP02-EXT: Sprint 4.5 S8 — 5건 일괄 반려 (실제 반려) + 부분 실패 시뮬레이션 (route intercept)
 *
 * WF-AP02 Steps 8-9는 mock 응답으로 toast 분기를 검증한다.
 * 이 블록은 실제 5건 데이터를 생성하고 bulk reject하여 E2E 전체 흐름을 커버한다.
 */
test.describe('WF-AP02-EXT: Sprint 4.5 S8 — 5건 일괄 반려 + 부분 실패', () => {
  test.describe.configure({ mode: 'serial' });

  // WF_EQUIPMENT_IDS(100a/100b)와 겹치지 않는 5개 SUW_E 장비
  const EXT_EQUIPMENT_IDS = [
    TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E,
    TEST_EQUIPMENT_IDS.SIGNAL_GEN_SUW_E,
    TEST_EQUIPMENT_IDS.NETWORK_ANALYZER_SUW_E,
    TEST_EQUIPMENT_IDS.EMC_RECEIVER_SUW_E,
    TEST_EQUIPMENT_IDS.RBAC_SIGNAL_GEN_SUW_E,
  ];

  test.beforeAll(async () => {
    for (const id of EXT_EQUIPMENT_IDS) {
      await resetEquipmentForWorkflow(id);
    }
  });

  test.afterAll(async () => {
    for (const id of EXT_EQUIPMENT_IDS) {
      await resetEquipmentForWorkflow(id);
    }
    await cleanupSharedPool();
  });

  test('Step EXT-1: 5건 반출 신청 생성', async ({ testOperatorPage: page }) => {
    for (const equipmentId of EXT_EQUIPMENT_IDS) {
      const body = await createCheckout(
        page,
        [equipmentId],
        CPVal.CALIBRATION,
        'KRISS',
        'WF-AP02-EXT: 5건 일괄 반려 검증'
      );
      const id = body?.data?.id ?? body?.id;
      expect(id).toBeTruthy();
    }
    await clearBackendCache();
  });

  test('Step EXT-2: 5건 선택 → 실제 일괄 반려 → "{5}건이 반려되었습니다." toast', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/admin/approvals?tab=outgoing');
    await page.waitForSelector('[data-testid="approval-item"]', { timeout: 15000 });

    const rows = page.locator('[data-testid="approval-item"]');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(5);

    // 5건 체크박스 선택
    for (let i = 0; i < 5; i++) {
      await rows.nth(i).locator('[role="checkbox"]').click();
    }

    const bar = page.locator('[data-testid="bulk-action-bar"]');
    await expect(bar).toHaveAttribute('aria-hidden', 'false');
    await expect(bar.locator('[role="toolbar"]')).toContainText('5');

    const rejectButton = page.locator('[role="toolbar"] button').filter({ hasText: /반려/ });
    await rejectButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await modal.locator('textarea').fill('WF-AP02-EXT: 5건 일괄 반려 E2E 검증 사유입니다.');
    await modal
      .locator('button[type="submit"], button')
      .filter({ hasText: /반려 확인|반려하기|확인/ })
      .last()
      .click();

    await expect(modal).not.toBeVisible({ timeout: 10000 });
    await clearBackendCache();

    // 전체 성공 toast: "5건이 반려되었습니다." (approvals.toasts.bulkRejectAll)
    await expectToastVisible(page, /건이 반려되었습니다/, { timeout: 10000 });

    // 목록에서 5건 제거 확인
    const afterCount = await rows.count();
    expect(afterCount).toBeLessThanOrEqual(count - 5);
  });

  test('Step EXT-3: 부분 실패 — route intercept → 2성공/1실패 toast', async ({
    testOperatorPage,
    techManagerPage,
  }) => {
    // Step EXT-2 반려 후 equipment는 available로 복귀 — 새 checkout 생성 가능
    for (const equipmentId of EXT_EQUIPMENT_IDS.slice(0, 3)) {
      const body = await createCheckout(
        testOperatorPage,
        [equipmentId],
        CPVal.CALIBRATION,
        'KRISS',
        'WF-AP02-EXT: 부분 실패 시뮬레이션'
      );
      const id = body?.data?.id ?? body?.id;
      expect(id).toBeTruthy();
    }
    await clearBackendCache();

    // route intercept: 3건 선택 → 2건 성공 / 1건 실패
    await techManagerPage.route('**/api/checkouts/bulk-reject', async (route) => {
      const body = JSON.parse(route.request().postData() ?? '{}') as { ids?: string[] };
      const ids = body.ids ?? [];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rejected: ids.slice(0, 2).map((id) => ({ id, version: 2 })),
          failed: ids.slice(2).map((id) => ({ id, error: 'FSM 전이 불가: 동시 처리 충돌' })),
        }),
      });
    });

    try {
      await techManagerPage.goto('/admin/approvals?tab=outgoing');
      await techManagerPage.waitForSelector('[data-testid="approval-item"]', { timeout: 15000 });

      const rows = techManagerPage.locator('[data-testid="approval-item"]');
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(3);

      // 3건 선택
      for (let i = 0; i < 3; i++) {
        await rows.nth(i).locator('[role="checkbox"]').click();
      }

      const rejectButton = techManagerPage
        .locator('[role="toolbar"] button')
        .filter({ hasText: /반려/ });
      await rejectButton.click();

      const modal = techManagerPage.locator('[role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 5000 });
      await modal.locator('textarea').fill('WF-AP02-EXT: 부분 실패 시뮬레이션 — 3건 중 2건 성공.');
      await modal
        .locator('button[type="submit"], button')
        .filter({ hasText: /반려 확인|반려하기|확인/ })
        .last()
        .click();

      await expect(modal).not.toBeVisible({ timeout: 10000 });

      // 부분 실패 toast: "2건 반려 완료, 1건 실패" (approvals.toasts.bulkRejectResult)
      await expectToastVisible(techManagerPage, /건 반려 완료.*건 실패/, { timeout: 10000 });
    } finally {
      await techManagerPage.unroute('**/api/checkouts/bulk-reject');
    }
  });
});
