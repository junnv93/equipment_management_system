/**
 * WF-07: 대여 반출 전체 흐름 (시험소 간) ★P1
 *
 * A 시험소 장비를 B 시험소가 대여하고, 4단계 상태 확인 후 반납.
 * 양측 확인(lender/borrower) + 권한 교차 검증.
 *
 * @see docs/workflows/critical-workflows.md WF-07
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import {
  CheckoutStatusValues as CSVal,
  CheckoutPurposeValues as CPVal,
  EquipmentStatusValues as ESVal,
} from '@equipment-management/schemas';
import {
  createCheckout,
  approveCheckout,
  conditionCheck,
  returnCheckout,
  approveReturn,
  expectEquipmentStatus,
  extractId,
  resetEquipmentForWorkflow,
  clearBackendCache,
  cleanupSharedPool,
} from './helpers/workflow-helpers';
import { TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';

/** SAR_PROBE_SUW_S — 같은 수원 사이트 내 다른 팀 장비 */
const WF_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.SAR_PROBE_SUW_S;

test.describe('WF-07: 대여 반출 전체 흐름 (시험소 간)', () => {
  test.describe.configure({ mode: 'serial' });

  let checkoutId: string;

  test.beforeAll(async () => {
    await resetEquipmentForWorkflow(WF_EQUIPMENT_ID);
  });

  test.afterAll(async () => {
    await resetEquipmentForWorkflow(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('Step 1: TE가 대여 반출 신청', async ({ testOperatorPage: page }) => {
    const body = await createCheckout(
      page,
      [WF_EQUIPMENT_ID],
      CPVal.RENTAL,
      'FCC EMC/RF 시험소',
      'WF-07 대여 반출 전체 흐름 테스트'
    );
    checkoutId = extractId(body);
    expect(checkoutId).toBeTruthy();
    await expectEquipmentStatus(page, WF_EQUIPMENT_ID, ESVal.AVAILABLE);
  });

  test('Step 2: TM이 대여 승인', async ({ techManagerPage: page }) => {
    await clearBackendCache();
    const body = await approveCheckout(page, checkoutId);
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.status).toBe(CSVal.APPROVED);
  });

  test('Step 3: 빌려주는 측 반출 확인 (lender_checkout)', async ({ techManagerPage: page }) => {
    await clearBackendCache();
    await conditionCheck(page, checkoutId, 'lender_checkout', 'technical_manager');
  });

  test('Step 4: 빌리는 측 수령 확인 (borrower_receive)', async ({ testOperatorPage: page }) => {
    await clearBackendCache();
    await conditionCheck(page, checkoutId, 'borrower_receive', 'test_engineer');

    // ★ 장비 상태: borrower_receive 후에도 checked_out 유지 (장비 상태 변경은 lender_checkout/lender_return에서만)
    await clearBackendCache();
    await expectEquipmentStatus(page, WF_EQUIPMENT_ID, ESVal.CHECKED_OUT);
  });

  test('Step 5: 빌리는 측 반납 확인 (borrower_return)', async ({ testOperatorPage: page }) => {
    await clearBackendCache();
    await conditionCheck(page, checkoutId, 'borrower_return', 'test_engineer');
  });

  test('Step 6: 빌려주는 측 반품 확인 (lender_return)', async ({ techManagerPage: page }) => {
    await clearBackendCache();
    await conditionCheck(page, checkoutId, 'lender_return', 'technical_manager');
  });

  test('Step 7: 반입 처리 + 반입 승인 → 장비 available 복원', async ({
    testOperatorPage: tePage,
    techManagerPage: tmPage,
  }) => {
    await clearBackendCache();
    await returnCheckout(tePage, checkoutId);

    await clearBackendCache();
    const body = await approveReturn(tmPage, checkoutId);
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.status).toBe(CSVal.RETURN_APPROVED);

    // ★ 장비 available 복원
    await clearBackendCache();
    await expectEquipmentStatus(tmPage, WF_EQUIPMENT_ID, ESVal.AVAILABLE, 'technical_manager');
  });

  test('Step 8: UI에서 장비 available 확인', async ({ testOperatorPage: page }) => {
    await page.goto(`/equipment/${WF_EQUIPMENT_ID}`);
    await expect(page.getByText('사용 가능').first()).toBeVisible({ timeout: 10000 });
  });
});
