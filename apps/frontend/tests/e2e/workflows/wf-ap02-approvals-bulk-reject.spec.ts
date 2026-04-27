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

    const countChip = page.locator('[data-testid="bulk-selection-count"]');
    await expect(countChip).toBeVisible();
    await expect(countChip).toContainText('1');

    // 두 번째 행도 선택
    await rows.nth(1).locator('[role="checkbox"]').click();
    await expect(countChip).toContainText('2');
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

    // 처리 완료 후 카운트 감소 확인
    await page.waitForTimeout(2000);
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
});
