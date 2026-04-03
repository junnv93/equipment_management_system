/**
 * WF-16: 승인 대시보드 카운트 연동 ★P3
 *
 * 다양한 승인 요청이 발생/처리될 때 승인 대시보드 카운트가 실시간 반영.
 *
 * @see docs/workflows/critical-workflows.md WF-16
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import { CheckoutPurposeValues as CPVal } from '@equipment-management/schemas';
import {
  createCheckout,
  approveCheckout,
  createCalibration,
  approveCalibration,
  getApprovalCounts,
  extractId,
  resetEquipmentForWorkflow,
  clearBackendCache,
  cleanupSharedPool,
} from './helpers/workflow-helpers';
import { TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';

const WF_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.SIGNAL_GEN_SUW_E;

test.describe('WF-16: 승인 대시보드 카운트 연동', () => {
  test.describe.configure({ mode: 'serial' });

  let checkoutId: string;
  let calibrationId: string;
  let initialOutgoing: number;
  let initialCalibration: number;

  test.beforeAll(async () => {
    await resetEquipmentForWorkflow(WF_EQUIPMENT_ID);
  });

  test.afterAll(async () => {
    await resetEquipmentForWorkflow(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('Step 1: 초기 카운트 확인', async ({ techManagerPage: page }) => {
    const counts = await getApprovalCounts(page);
    initialOutgoing = counts.outgoing ?? 0;
    initialCalibration = counts.calibration ?? 0;
  });

  test('Step 2: 반출 신청 → 반출 대기 카운트 +1', async ({
    testOperatorPage: tePage,
    techManagerPage: tmPage,
  }) => {
    const body = await createCheckout(
      tePage,
      [WF_EQUIPMENT_ID],
      CPVal.CALIBRATION,
      'KRISS',
      'WF-16: 카운트 검증'
    );
    checkoutId = extractId(body);

    await clearBackendCache();
    const counts = await getApprovalCounts(tmPage);
    // ★ 반출 대기 카운트 증가
    expect(counts.outgoing).toBeGreaterThanOrEqual(initialOutgoing + 1);
  });

  test('Step 3: 반출 승인 → 반출 대기 카운트 -1', async ({ techManagerPage: page }) => {
    await clearBackendCache();
    await approveCheckout(page, checkoutId);

    await clearBackendCache();
    const counts = await getApprovalCounts(page);
    // ★ 승인 후 카운트 감소
    expect(counts.outgoing).toBeLessThanOrEqual(initialOutgoing);
  });

  test('Step 4: 교정 기록 등록 → 교정 대기 카운트 +1', async ({
    testOperatorPage: tePage,
    techManagerPage: tmPage,
  }) => {
    await clearBackendCache();
    const today = new Date().toISOString().split('T')[0];
    const calBody = await createCalibration(tePage, WF_EQUIPMENT_ID, today);
    calibrationId = extractId(calBody);

    await clearBackendCache();
    const counts = await getApprovalCounts(tmPage);
    // ★ 교정 등록 후 카운트 증가
    expect(counts.calibration).toBeGreaterThanOrEqual(initialCalibration + 1);
  });

  test('Step 5: 교정 승인 → 교정 대기 카운트 -1', async ({ techManagerPage: page }) => {
    await clearBackendCache();
    await approveCalibration(page, calibrationId);

    await clearBackendCache();
    const counts = await getApprovalCounts(page);
    // ★ 교정 승인 후 카운트 감소
    expect(counts.calibration).toBeLessThanOrEqual(initialCalibration);
  });
});
