/**
 * WF-06: 반입 반려 → 재검사 → 재승인 ★P2
 *
 * 반입 후 검사에서 문제 발견, 반려 후 재처리.
 * 반려 시 상태 checked_out 복귀 + 검사 결과 초기화.
 *
 * @see docs/workflows/critical-workflows.md WF-06
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
  returnCheckout,
  approveReturn,
  rejectReturn,
  expectEquipmentStatus,
  extractId,
  apiGet,
  resetEquipmentForWorkflow,
  clearBackendCache,
  cleanupSharedPool,
} from './helpers/workflow-helpers';
import { TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';

const WF_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.NETWORK_ANALYZER_SUW_E;

test.describe('WF-06: 반입 반려 → 재검사 → 재승인', () => {
  test.describe.configure({ mode: 'serial' });

  let checkoutId: string;

  test.beforeAll(async () => {
    await resetEquipmentForWorkflow(WF_EQUIPMENT_ID);
  });

  test.afterAll(async () => {
    await resetEquipmentForWorkflow(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('Step 1: 반출 신청 → 승인 → 반출 시작', async ({
    testOperatorPage: tePage,
    techManagerPage: tmPage,
  }) => {
    const body = await createCheckout(
      tePage,
      [WF_EQUIPMENT_ID],
      CPVal.CALIBRATION,
      'KRISS',
      'WF-06: 반입 반려 테스트'
    );
    checkoutId = extractId(body);

    await clearBackendCache();
    await approveCheckout(tmPage, checkoutId);

    await clearBackendCache();
    await startCheckout(tePage, checkoutId);
  });

  test('Step 2: TE가 반입 처리', async ({ testOperatorPage: page }) => {
    await clearBackendCache();
    await returnCheckout(page, checkoutId);
  });

  test('Step 3: TM이 반입 반려 → checked_out 복귀', async ({ techManagerPage: page }) => {
    await clearBackendCache();
    const body = await rejectReturn(page, checkoutId, 'WF-06: 교정 성적서 누락, 재검사 필요');
    const data = (body.data ?? body) as Record<string, unknown>;
    // ★ 상태가 checked_out으로 복귀
    expect(data.status).toBe(CSVal.CHECKED_OUT);
  });

  test('Step 4: 검사 결과 초기화 확인', async ({ techManagerPage: page }) => {
    await clearBackendCache();
    const resp = await apiGet(page, `/api/checkouts/${checkoutId}`, 'technical_manager');
    const body = await resp.json();
    const data = (body.data ?? body) as Record<string, unknown>;
    // 반려 시 검사 체크가 초기화되어야 함
    expect(data.calibrationChecked).toBeFalsy();
  });

  test('Step 5: TE가 재반입 처리', async ({ testOperatorPage: page }) => {
    await clearBackendCache();
    await returnCheckout(page, checkoutId, {
      calibrationChecked: true,
      workingStatusChecked: true,
    });
  });

  test('Step 6: TM이 반입 승인 → 장비 available', async ({ techManagerPage: page }) => {
    await clearBackendCache();
    const body = await approveReturn(page, checkoutId);
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.status).toBe(CSVal.RETURN_APPROVED);

    await clearBackendCache();
    await expectEquipmentStatus(page, WF_EQUIPMENT_ID, ESVal.AVAILABLE, 'technical_manager');
  });
});
