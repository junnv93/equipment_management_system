/**
 * WF-05: 반출 반려 → 재신청 ★P2
 *
 * 반출 신청이 반려되고, 수정 후 재신청하여 승인.
 * 반려 후 장비 상태 유지 + 동일 장비 재신청 가능 검증.
 *
 * @see docs/workflows/critical-workflows.md WF-05
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
  startCheckout,
  rejectCheckout,
  expectEquipmentStatus,
  extractId,
  resetEquipmentForWorkflow,
  clearBackendCache,
  cleanupSharedPool,
} from './helpers/workflow-helpers';
import { TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';

const WF_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.SIGNAL_GEN_SUW_E;

test.describe('WF-05: 반출 반려 → 재신청', () => {
  test.describe.configure({ mode: 'serial' });

  let firstCheckoutId: string;
  let secondCheckoutId: string;

  test.beforeAll(async () => {
    await resetEquipmentForWorkflow(WF_EQUIPMENT_ID);
  });

  test.afterAll(async () => {
    await resetEquipmentForWorkflow(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('Step 1: TE가 반출 신청', async ({ testOperatorPage: page }) => {
    const body = await createCheckout(
      page,
      [WF_EQUIPMENT_ID],
      CPVal.CALIBRATION,
      'KRISS',
      'WF-05: 반려 테스트용 신청'
    );
    firstCheckoutId = extractId(body);
  });

  test('Step 2: TM이 반려 → rejected, 장비 available 유지', async ({ techManagerPage: page }) => {
    await clearBackendCache();
    const body = await rejectCheckout(page, firstCheckoutId, 'WF-05: 서류 미비');
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.status).toBe(CSVal.REJECTED);

    // ★ 장비 상태: 반려 후에도 available 유지
    await expectEquipmentStatus(page, WF_EQUIPMENT_ID, ESVal.AVAILABLE, 'technical_manager');
  });

  test('Step 3: TE가 동일 장비로 재신청 → 성공', async ({ testOperatorPage: page }) => {
    await clearBackendCache();
    const body = await createCheckout(
      page,
      [WF_EQUIPMENT_ID],
      CPVal.CALIBRATION,
      'KRISS (재신청)',
      'WF-05: 서류 보완 후 재신청'
    );
    secondCheckoutId = extractId(body);
    expect(secondCheckoutId).toBeTruthy();
    expect(secondCheckoutId).not.toBe(firstCheckoutId);
  });

  test('Step 4: 재신청 → 승인 → 반출 시작 정상 진행', async ({
    techManagerPage: tmPage,
    testOperatorPage: tePage,
  }) => {
    await clearBackendCache();
    await approveCheckout(tmPage, secondCheckoutId);

    await clearBackendCache();
    await startCheckout(tePage, secondCheckoutId);

    await clearBackendCache();
    await expectEquipmentStatus(tePage, WF_EQUIPMENT_ID, ESVal.CHECKED_OUT);
  });
});
