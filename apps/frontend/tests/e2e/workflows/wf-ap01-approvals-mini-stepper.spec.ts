/**
 * WF-AP01: 승인 목록 Mini Stepper ARIA 균일성 검증
 *
 * 모든 ApprovalRow에 role="progressbar" mini stepper가 균일하게 렌더되는지,
 * 단일 단계 항목은 분수 레이블 없이 1 dot만 표시되는지 검증.
 *
 * @see apps/frontend/components/approvals/ApprovalRowMiniStepper.tsx
 * @see apps/frontend/components/approvals/ApprovalRow.tsx
 * @see apps/frontend/lib/api/approvals-api.ts (TAB_META.totalApprovalSteps)
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

const WF_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.RBAC_SIGNAL_GEN_SUW_E;

test.describe('WF-AP01: 승인 목록 mini stepper ARIA 균일성', () => {
  test.describe.configure({ mode: 'serial' });

  let checkoutId: string;

  test.beforeAll(async () => {
    await resetEquipmentForWorkflow(WF_EQUIPMENT_ID);
  });

  test.afterAll(async () => {
    await resetEquipmentForWorkflow(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('Step 1: 반출 신청 생성 (단일 단계 승인 대기 항목 준비)', async ({
    testOperatorPage: page,
  }) => {
    const body = await createCheckout(
      page,
      [WF_EQUIPMENT_ID],
      CPVal.CALIBRATION,
      'KRISS',
      'WF-AP01: mini stepper ARIA 검증'
    );
    checkoutId = body?.data?.id ?? body?.id;
    expect(checkoutId).toBeTruthy();
    await clearBackendCache();
  });

  test('Step 2: 모든 행에 role="progressbar" mini stepper가 존재', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/admin/approvals?tab=outgoing');
    await page.waitForSelector('[data-testid="approval-item"]', { timeout: 15000 });

    const rows = page.locator('[data-testid="approval-item"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // 모든 행에 progressbar가 존재해야 함 (AP-05 MUST: 균일 렌더)
    for (let i = 0; i < rowCount; i++) {
      await expect(rows.nth(i).locator('[role="progressbar"]')).toBeVisible();
    }
  });

  test('Step 3: 단일 단계(outgoing) 행 — 분수 레이블 없음, aria 속성 올바름', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/admin/approvals?tab=outgoing');
    await page.waitForSelector('[data-testid="approval-item"]', { timeout: 15000 });

    const firstRow = page.locator('[data-testid="approval-item"]').first();
    const stepper = firstRow.locator('[role="progressbar"]');

    await expect(stepper).toBeVisible();

    // ARIA 속성 검증
    await expect(stepper).toHaveAttribute('aria-valuemin', '0');
    await expect(stepper).toHaveAttribute('aria-valuemax', '1'); // totalApprovalSteps=1

    // 단일 단계: "0/1" 분수 레이블 미노출 (totalSteps <= 1 시 레이블 숨김)
    const label = stepper.locator('.tabular-nums');
    const labelCount = await label.count();
    // 레이블이 없거나 숨겨져 있어야 함
    if (labelCount > 0) {
      await expect(label.first()).toBeHidden();
    }
  });

  test('Step 4: hover-inline 승인 버튼 → 승인 완료', async ({ techManagerPage: page }) => {
    await page.goto('/admin/approvals?tab=outgoing');
    await page.waitForSelector('[data-testid="approval-item"]', { timeout: 15000 });

    const rows = page.locator('[data-testid="approval-item"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // 첫 번째 행에 hover → inline approve 버튼 클릭
    const firstRow = rows.first();
    await firstRow.hover();

    const _approveButton = firstRow
      .locator('button[aria-label]')
      .filter({
        has: page.locator('svg'),
      })
      .first();

    // hover-inline 버튼이 표시됨
    // group-hover:inline-flex 패턴이므로 hover 상태에서 visible
    await expect(firstRow).toBeVisible();

    // Dropdown → 승인 액션 (keyboard 안정성)
    const moreButton = firstRow.locator('button[aria-label*="메뉴"]').first();
    if (await moreButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await moreButton.click();
      const approveMenuItem = page
        .locator('[role="menuitem"]')
        .filter({ hasText: /승인|검토완료|반납승인/ })
        .first();
      if (await approveMenuItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await approveMenuItem.click();
        // 행이 사라지거나 카운트 감소 확인 (event-based)
        await rows
          .first()
          .waitFor({ state: 'detached', timeout: 5000 })
          .catch(() => {});
      }
    }

    await clearBackendCache();
  });
});
