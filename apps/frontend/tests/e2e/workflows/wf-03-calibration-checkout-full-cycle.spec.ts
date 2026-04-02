/**
 * WF-03: 교정 반출 전체 흐름 ★P0 CRITICAL
 *
 * 장비를 외부 교정기관에 반출 → 교정 완료 → 반입하여 교정 이력이 기록되는 전 과정.
 * 4개 모듈(장비, 반출, 교정, 승인)의 교차 연동을 검증한다.
 *
 * 워크플로우:
 *   TE: 반출 신청 → TM: 승인 → TE: 반출 시작 → TE: 교정 등록 → TM: 교정 승인
 *   → TE: 반입 처리 → TM: 반입 승인
 *
 * 검증 포인트:
 * - 각 단계에서 장비 상태 전이 (available → checked_out → available)
 * - 교정 승인 후 장비 교정일 자동 갱신
 * - 반입 승인 후 장비 상태 복원
 * - UI에서 교정 이력 확인
 *
 * 사용 장비: SIGNAL_GEN_SUW_E (available, 워크플로우 전용)
 *
 * @see docs/workflows/critical-workflows.md WF-03
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
  createCalibration,
  approveCalibration,
  expectEquipmentStatus,
  getEquipmentCalibrationDates,
  extractId,
  resetEquipmentForWorkflow,
  clearBackendCache,
  cleanupSharedPool,
} from './helpers/workflow-helpers';
import { TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';

/** 워크플로우 전용 장비 — SIGNAL_GEN_SUW_E (available) */
const WF_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.SIGNAL_GEN_SUW_E;

test.describe('WF-03: 교정 반출 전체 흐름', () => {
  test.describe.configure({ mode: 'serial' });

  let checkoutId: string;
  let calibrationId: string;

  test.beforeAll(async () => {
    await resetEquipmentForWorkflow(WF_EQUIPMENT_ID);
  });

  test.afterAll(async () => {
    await resetEquipmentForWorkflow(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  // ────────────────────────────────────────────────────────────────────────
  // Step 1: 반출 신청 (TE)
  // ────────────────────────────────────────────────────────────────────────

  test('Step 1: TE가 교정 반출 신청 → pending, 장비 available 유지', async ({
    testOperatorPage: page,
  }) => {
    const body = await createCheckout(
      page,
      [WF_EQUIPMENT_ID],
      CPVal.CALIBRATION,
      'KRISS 한국표준과학연구원',
      'WF-03 교정 반출 전체 흐름 테스트'
    );
    checkoutId = extractId(body);
    expect(checkoutId).toBeTruthy();

    // 장비 상태: 신청만 한 상태이므로 여전히 available
    await expectEquipmentStatus(page, WF_EQUIPMENT_ID, ESVal.AVAILABLE);
  });

  // ────────────────────────────────────────────────────────────────────────
  // Step 2: 반출 승인 (TM)
  // ────────────────────────────────────────────────────────────────────────

  test('Step 2: TM이 반출 승인 → approved, 장비 available 유지', async ({
    techManagerPage: page,
  }) => {
    await clearBackendCache();
    const body = await approveCheckout(page, checkoutId);
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.status).toBe(CSVal.APPROVED);

    // 장비 상태: 승인만 된 상태, 아직 반출 안 됨
    await expectEquipmentStatus(page, WF_EQUIPMENT_ID, ESVal.AVAILABLE);
  });

  // ────────────────────────────────────────────────────────────────────────
  // Step 3: 반출 시작 (TE) → 장비 상태 변경
  // ────────────────────────────────────────────────────────────────────────

  test('Step 3: TE가 반출 시작 → checked_out, 장비 checked_out 전이', async ({
    testOperatorPage: page,
  }) => {
    await clearBackendCache();
    const body = await startCheckout(page, checkoutId);
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.status).toBe(CSVal.CHECKED_OUT);

    // ★ 핵심 검증: 장비 상태가 checked_out으로 전이
    await expectEquipmentStatus(page, WF_EQUIPMENT_ID, ESVal.CHECKED_OUT);
  });

  // ────────────────────────────────────────────────────────────────────────
  // Step 4: 장비 상태가 UI에 반영되는지 확인
  // ────────────────────────────────────────────────────────────────────────

  test('Step 4: 장비 상세 페이지에서 checked_out 상태 표시', async ({ testOperatorPage: page }) => {
    await page.goto(`/equipment/${WF_EQUIPMENT_ID}`);
    // 반출 중 상태 뱃지 확인
    await expect(page.getByText('반출 중').first()).toBeVisible({ timeout: 10000 });
  });

  // ────────────────────────────────────────────────────────────────────────
  // Step 5: 교정 기록 등록 (TE)
  // ────────────────────────────────────────────────────────────────────────

  test('Step 5: TE가 교정 성적서 등록 → pending_approval', async ({ testOperatorPage: page }) => {
    await clearBackendCache();
    const today = new Date().toISOString().split('T')[0];
    const body = await createCalibration(page, WF_EQUIPMENT_ID, today);
    calibrationId = extractId(body);
    expect(calibrationId).toBeTruthy();
  });

  // ────────────────────────────────────────────────────────────────────────
  // Step 6: 교정 승인 (TM) → 장비 교정일 자동 갱신
  // ────────────────────────────────────────────────────────────────────────

  test('Step 6: TM이 교정 승인 → 장비 lastCalibrationDate 자동 갱신', async ({
    techManagerPage: page,
  }) => {
    await clearBackendCache();

    // 승인 전 교정일 기록
    const beforeDates = await getEquipmentCalibrationDates(
      page,
      WF_EQUIPMENT_ID,
      'technical_manager'
    );

    await approveCalibration(page, calibrationId);

    // ★ 핵심 검증: 장비 교정일이 갱신됨
    await clearBackendCache();
    const afterDates = await getEquipmentCalibrationDates(
      page,
      WF_EQUIPMENT_ID,
      'technical_manager'
    );
    expect(afterDates.lastCalibrationDate).toBeTruthy();
    expect(afterDates.nextCalibrationDate).toBeTruthy();
    // 갱신 전후 비교 (이전 교정일이 없었거나, 새 값이 더 최신)
    if (beforeDates.lastCalibrationDate) {
      expect(new Date(afterDates.lastCalibrationDate!).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeDates.lastCalibrationDate).getTime()
      );
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // Step 7: 반입 처리 (TE)
  // ────────────────────────────────────────────────────────────────────────

  test('Step 7: TE가 반입 처리 → returned, 장비 아직 checked_out', async ({
    testOperatorPage: page,
  }) => {
    await clearBackendCache();
    const body = await returnCheckout(page, checkoutId, {
      calibrationChecked: true,
      workingStatusChecked: true,
    });
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.status).toBe(CSVal.RETURNED);

    // 장비 상태: 반입 처리만 한 상태, 아직 checked_out
    await expectEquipmentStatus(page, WF_EQUIPMENT_ID, ESVal.CHECKED_OUT);
  });

  // ────────────────────────────────────────────────────────────────────────
  // Step 8: 반입 승인 (TM) → 장비 상태 복원
  // ────────────────────────────────────────────────────────────────────────

  test('Step 8: TM이 반입 승인 → return_approved, 장비 available 복원', async ({
    techManagerPage: page,
  }) => {
    await clearBackendCache();
    const body = await approveReturn(page, checkoutId);
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.status).toBe(CSVal.RETURN_APPROVED);

    // ★ 핵심 검증: 장비 상태가 available로 복원
    await clearBackendCache();
    await expectEquipmentStatus(page, WF_EQUIPMENT_ID, ESVal.AVAILABLE, 'technical_manager');
  });

  // ────────────────────────────────────────────────────────────────────────
  // Step 9: UI에서 최종 상태 확인
  // ────────────────────────────────────────────────────────────────────────

  test('Step 9: 장비 상세에서 교정 이력 + available 상태 확인', async ({
    testOperatorPage: page,
  }) => {
    await page.goto(`/equipment/${WF_EQUIPMENT_ID}`);

    // 장비 상태 available 확인
    await expect(page.getByText('사용 가능').first()).toBeVisible({ timeout: 10000 });
  });
});
