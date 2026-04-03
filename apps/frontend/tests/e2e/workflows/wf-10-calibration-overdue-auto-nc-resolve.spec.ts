/**
 * WF-10: 교정 기한 초과 → 자동 부적합 → 재교정 해결 ★P0 CRITICAL
 *
 * 교정 기한이 지난 장비가 자동으로 부적합 처리되고, 재교정으로 해결되는 전 과정.
 * 4개 모듈(장비, 반출, 교정, 부적합)이 연동되는 가장 복잡한 워크플로우.
 *
 * 워크플로우:
 *   시스템: CalibrationOverdueScheduler → 장비 non_conforming + NC 자동 생성
 *   TE→TM: 교정 반출 전체 흐름 (WF-03)
 *   TM: 교정 승인 → NC 자동 조치 (OPEN → CORRECTED)
 *   TM: NC 종결 → 장비 available 복원
 *
 * 검증 포인트:
 * - 교정 기한 초과 시 장비 상태 자동 전이
 * - 부적합(calibration_overdue) 자동 생성
 * - 교정 승인 시 NC가 자동으로 CORRECTED 전이
 * - NC 종결 후 장비 available 복원
 *
 * 사용 장비: COUPLER_SUW_E (calibration_overdue 상태 시드 데이터)
 *
 * @see docs/workflows/critical-workflows.md WF-10
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import {
  EquipmentStatusValues as ESVal,
  CheckoutPurposeValues as CPVal,
} from '@equipment-management/schemas';
import {
  createCheckout,
  approveCheckout,
  startCheckout,
  returnCheckout,
  approveReturn,
  createCalibration,
  approveCalibration,
  closeNonConformance,
  expectEquipmentStatus,
  extractId,
  apiGet,
  clearBackendCache,
  cleanupSharedPool,
} from './helpers/workflow-helpers';
import { TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';
import { getSharedPool } from '../shared/helpers/api-helpers';

/**
 * 워크플로우 전용 장비 — COUPLER_SUW_E
 * 시드 데이터에서 calibration_overdue 상태로 설정됨
 */
const WF_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.COUPLER_SUW_E;

test.describe('WF-10: 교정 기한 초과 → 자동 NC → 재교정 해결', () => {
  test.describe.configure({ mode: 'serial' });

  let ncId: string;
  let checkoutId: string;
  let calibrationId: string;

  test.beforeAll(async () => {
    const pool = getSharedPool();

    // 장비를 calibration_overdue + non_conforming 상태로 설정 (스케줄러가 실행된 후 상태)
    await pool.query(
      `UPDATE equipment SET status = $2, version = 1, updated_at = NOW() WHERE id = $1`,
      [WF_EQUIPMENT_ID, ESVal.NON_CONFORMING]
    );

    // 동적 생성된 NC/checkout/calibration 정리
    await pool.query(
      `UPDATE non_conformances SET deleted_at = NOW()
       WHERE equipment_id = $1 AND id::text NOT LIKE 'aaaa%' AND deleted_at IS NULL`,
      [WF_EQUIPMENT_ID]
    );
    await pool.query(
      `UPDATE checkouts SET status = 'canceled', updated_at = NOW()
       WHERE status NOT IN ('canceled', 'return_approved', 'rejected')
         AND id IN (SELECT c.id FROM checkouts c JOIN checkout_items ci ON c.id = ci.checkout_id WHERE ci.equipment_id = $1)
         AND id::text NOT LIKE '10000000-%'`,
      [WF_EQUIPMENT_ID]
    );

    // calibration_overdue 타입 NC를 OPEN 상태로 생성 (스케줄러 시뮬레이션)
    const ncResult = await pool.query(
      `INSERT INTO non_conformances (equipment_id, nc_type, status, discovery_date, cause, discovered_by, version)
       VALUES ($1, 'calibration_overdue', 'open', NOW(), '교정 기한 초과 (WF-10 테스트)', (SELECT id FROM users LIMIT 1), 1)
       RETURNING id`,
      [WF_EQUIPMENT_ID]
    );
    ncId = ncResult.rows[0].id;

    await clearBackendCache();
  });

  test.afterAll(async () => {
    const pool = getSharedPool();

    // 정리: NC 삭제 + 장비 available 복원
    await pool.query(`UPDATE non_conformances SET deleted_at = NOW() WHERE id = $1`, [ncId]);
    await pool.query(
      `UPDATE checkouts SET status = 'canceled', updated_at = NOW()
       WHERE status NOT IN ('canceled', 'return_approved', 'rejected')
         AND id IN (SELECT c.id FROM checkouts c JOIN checkout_items ci ON c.id = ci.checkout_id WHERE ci.equipment_id = $1)
         AND id::text NOT LIKE '10000000-%'`,
      [WF_EQUIPMENT_ID]
    );
    await pool.query(
      `UPDATE calibrations SET deleted_at = NOW()
       WHERE equipment_id = $1 AND id::text NOT LIKE 'bbbb%' AND deleted_at IS NULL`,
      [WF_EQUIPMENT_ID]
    );
    await pool.query(
      `UPDATE equipment SET status = $2, version = 1, updated_at = NOW() WHERE id = $1`,
      [WF_EQUIPMENT_ID, ESVal.AVAILABLE]
    );
    await clearBackendCache();
    await cleanupSharedPool();
  });

  // ────────────────────────────────────────────────────────────────────────
  // Step 1: 초기 상태 확인 — non_conforming + NC open
  // ────────────────────────────────────────────────────────────────────────

  test('Step 1: 장비 non_conforming + calibration_overdue NC open 확인', async ({
    testOperatorPage: page,
  }) => {
    // 장비 상태 확인
    await expectEquipmentStatus(page, WF_EQUIPMENT_ID, ESVal.NON_CONFORMING);

    // NC 존재 확인
    const ncResp = await apiGet(page, `/api/non-conformances/${ncId}`, 'test_engineer');
    expect(ncResp.ok()).toBeTruthy();
    const ncBody = await ncResp.json();
    const ncData = (ncBody.data ?? ncBody) as Record<string, unknown>;
    expect(ncData.status).toBe('open');
    expect(ncData.ncType).toBe('calibration_overdue');
  });

  // ────────────────────────────────────────────────────────────────────────
  // Step 2: UI에서 부적합 상태 확인
  // ────────────────────────────────────────────────────────────────────────

  test('Step 2: 장비 상세에서 부적합 상태 표시', async ({ testOperatorPage: page }) => {
    await page.goto(`/equipment/${WF_EQUIPMENT_ID}`);
    await expect(page.getByText('부적합').first()).toBeVisible({ timeout: 10000 });
  });

  // ────────────────────────────────────────────────────────────────────────
  // Step 3~6: 교정 반출 흐름 (WF-03 축약)
  // ────────────────────────────────────────────────────────────────────────

  test('Step 3: TE가 교정 반출 신청 + TM 승인 + 반출 시작', async ({
    testOperatorPage: tePage,
    techManagerPage: tmPage,
  }) => {
    const body = await createCheckout(
      tePage,
      [WF_EQUIPMENT_ID],
      CPVal.CALIBRATION,
      'KRISS 한국표준과학연구원',
      'WF-10: 교정 기한 초과 장비 재교정'
    );
    checkoutId = extractId(body);

    await clearBackendCache();
    await approveCheckout(tmPage, checkoutId);

    await clearBackendCache();
    await startCheckout(tePage, checkoutId);

    await clearBackendCache();
    await expectEquipmentStatus(tePage, WF_EQUIPMENT_ID, ESVal.CHECKED_OUT);
  });

  // ────────────────────────────────────────────────────────────────────────
  // Step 4: 교정 기록 등록 + 승인 → NC 자동 조치
  // ────────────────────────────────────────────────────────────────────────

  test('Step 4: 교정 등록 + 승인 → calibration_overdue NC가 자동 CORRECTED', async ({
    testOperatorPage: tePage,
    techManagerPage: tmPage,
  }) => {
    await clearBackendCache();
    const today = new Date().toISOString().split('T')[0];
    const calBody = await createCalibration(tePage, WF_EQUIPMENT_ID, today);
    calibrationId = extractId(calBody);

    await clearBackendCache();
    await approveCalibration(tmPage, calibrationId);

    // ★ 핵심 검증: 교정 승인 후 NC가 자동으로 CORRECTED 전이
    await clearBackendCache();
    const ncResp = await apiGet(tmPage, `/api/non-conformances/${ncId}`, 'technical_manager');
    const ncBody = await ncResp.json();
    const ncData = (ncBody.data ?? ncBody) as Record<string, unknown>;
    expect(ncData.status).toBe('corrected');
  });

  // ────────────────────────────────────────────────────────────────────────
  // Step 5: 반입 처리 + 반입 승인
  // ────────────────────────────────────────────────────────────────────────

  test('Step 5: 반입 처리 + 반입 승인', async ({
    testOperatorPage: tePage,
    techManagerPage: tmPage,
  }) => {
    await clearBackendCache();
    await returnCheckout(tePage, checkoutId, {
      calibrationChecked: true,
      workingStatusChecked: true,
    });

    await clearBackendCache();
    await approveReturn(tmPage, checkoutId);
  });

  // ────────────────────────────────────────────────────────────────────────
  // Step 6: NC 종결 → 장비 available 복원
  // ────────────────────────────────────────────────────────────────────────

  test('Step 6: TM이 NC 종결 → 장비 available 복원', async ({ techManagerPage: page }) => {
    await clearBackendCache();
    await closeNonConformance(page, ncId);

    // ★ 핵심 검증: 모든 NC 종결 후 장비 available 복원
    await clearBackendCache();
    await expectEquipmentStatus(page, WF_EQUIPMENT_ID, ESVal.AVAILABLE, 'technical_manager');
  });

  // ────────────────────────────────────────────────────────────────────────
  // Step 7: UI 최종 확인
  // ────────────────────────────────────────────────────────────────────────

  test('Step 7: 장비 상세에서 available + 교정일 갱신 확인', async ({ testOperatorPage: page }) => {
    await page.goto(`/equipment/${WF_EQUIPMENT_ID}`);
    await expect(page.getByText('사용 가능').first()).toBeVisible({ timeout: 10000 });
  });
});
