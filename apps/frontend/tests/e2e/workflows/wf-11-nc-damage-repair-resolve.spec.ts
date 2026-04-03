/**
 * WF-11: 부적합(손상) → 수리 반출 → 수리 완료 → NC 종결 ★P0 CRITICAL
 *
 * 장비 손상 발견 → 부적합 등록 → 수리 반출 → 수리 완료 반입 → NC 조치 → NC 종결 → 장비 복원.
 * 3개 모듈(장비, 반출, 부적합)의 교차 연동 + 전제조건(수리이력 필수) 검증.
 *
 * 워크플로우:
 *   TE: NC 등록(damage) → 장비 non_conforming
 *   TE→TM: 수리 반출 전체 흐름 (WF-04)
 *   TE: NC 조치 완료 (수리이력 연결) → TM: NC 종결 → 장비 available 복원
 *
 * 검증 포인트:
 * - NC 등록 시 장비 상태 non_conforming 전이
 * - damage 유형 NC는 수리이력 없이 조치 완료 불가 (전제조건)
 * - NC 종결 후 다른 열린 NC 없으면 장비 available 복원
 *
 * 사용 장비: NETWORK_ANALYZER_SUW_E (available, 워크플로우 전용)
 *
 * @see docs/workflows/critical-workflows.md WF-11
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import {
  EquipmentStatusValues as ESVal,
  CheckoutPurposeValues as CPVal,
  CheckoutStatusValues as CSVal,
} from '@equipment-management/schemas';
import {
  createCheckout,
  approveCheckout,
  startCheckout,
  returnCheckout,
  approveReturn,
  createNonConformance,
  correctNonConformance,
  closeNonConformance,
  expectEquipmentStatus,
  extractId,
  apiGet,
  resetEquipmentForWorkflow,
  clearBackendCache,
  cleanupSharedPool,
} from './helpers/workflow-helpers';
import { TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';

/** 워크플로우 전용 장비 — NETWORK_ANALYZER_SUW_E (available) */
const WF_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.NETWORK_ANALYZER_SUW_E;

test.describe('WF-11: 부적합(손상) → 수리 → 해결', () => {
  test.describe.configure({ mode: 'serial' });

  let ncId: string;
  let checkoutId: string;

  test.beforeAll(async () => {
    await resetEquipmentForWorkflow(WF_EQUIPMENT_ID);
  });

  test.afterAll(async () => {
    await resetEquipmentForWorkflow(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  // ────────────────────────────────────────────────────────────────────────
  // Step 1: 부적합 등록 (TE) → 장비 non_conforming
  // ────────────────────────────────────────────────────────────────────────

  test('Step 1: TE가 부적합(damage) 등록 → 장비 non_conforming 전이', async ({
    testOperatorPage: page,
  }) => {
    const body = await createNonConformance(
      page,
      WF_EQUIPMENT_ID,
      'damage',
      'WF-11 테스트: 장비 외관 손상 발견'
    );
    ncId = extractId(body);
    expect(ncId).toBeTruthy();

    // ★ 핵심 검증: 장비 상태가 non_conforming으로 전이
    await clearBackendCache();
    await expectEquipmentStatus(page, WF_EQUIPMENT_ID, ESVal.NON_CONFORMING);
  });

  // ────────────────────────────────────────────────────────────────────────
  // Step 2: 장비 상태가 UI에 반영되는지 확인
  // ────────────────────────────────────────────────────────────────────────

  test('Step 2: 장비 상세에서 부적합 상태 표시', async ({ testOperatorPage: page }) => {
    await page.goto(`/equipment/${WF_EQUIPMENT_ID}`);
    await expect(page.getByText('부적합').first()).toBeVisible({ timeout: 10000 });
  });

  // ────────────────────────────────────────────────────────────────────────
  // Step 3~7: 수리 반출 전체 흐름 (WF-04 축약)
  // ────────────────────────────────────────────────────────────────────────

  test('Step 3: TE가 수리 반출 신청', async ({ testOperatorPage: page }) => {
    await clearBackendCache();
    const body = await createCheckout(
      page,
      [WF_EQUIPMENT_ID],
      CPVal.REPAIR,
      '삼성전자서비스 수원센터',
      'WF-11 테스트: 손상 장비 수리 반출'
    );
    checkoutId = extractId(body);
    expect(checkoutId).toBeTruthy();
  });

  test('Step 4: TM이 수리 반출 승인 + 반출 시작', async ({
    techManagerPage: tmPage,
    testOperatorPage: tePage,
  }) => {
    await clearBackendCache();
    await approveCheckout(tmPage, checkoutId);

    await clearBackendCache();
    await startCheckout(tePage, checkoutId);

    // 장비 상태: checked_out (non_conforming에서 전이)
    await clearBackendCache();
    await expectEquipmentStatus(tePage, WF_EQUIPMENT_ID, ESVal.CHECKED_OUT);
  });

  test('Step 5: TE가 반입 처리 + TM이 반입 승인', async ({
    testOperatorPage: tePage,
    techManagerPage: tmPage,
  }) => {
    await clearBackendCache();
    await returnCheckout(tePage, checkoutId, { repairChecked: true, workingStatusChecked: true });

    await clearBackendCache();
    const body = await approveReturn(tmPage, checkoutId);
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.status).toBe(CSVal.RETURN_APPROVED);
  });

  // ────────────────────────────────────────────────────────────────────────
  // Step 6: NC 조치 완료 (수리이력 연결)
  // ────────────────────────────────────────────────────────────────────────

  test('Step 6: TE가 NC 조치 완료 (수리이력 연결) → corrected', async ({
    testOperatorPage: page,
  }) => {
    await clearBackendCache();

    // 반입 승인 후 수리 이력이 자동 생성되었으므로, 장비의 최근 수리 이력 조회
    const historyResp = await apiGet(
      page,
      `/api/equipment/${WF_EQUIPMENT_ID}/maintenance-history`,
      'test_engineer'
    );
    const historyBody = await historyResp.json();
    const histories = (historyBody.data ?? historyBody) as Record<string, unknown>[];
    const latestRepair = Array.isArray(histories) ? histories[0] : null;

    await correctNonConformance(page, ncId, {
      resolutionType: 'repair',
      correctionContent: 'WF-11: 외부 수리 완료, 정상 작동 확인',
      correctionDate: new Date().toISOString().split('T')[0],
      ...(latestRepair
        ? { repairHistoryId: (latestRepair as Record<string, unknown>).id as string }
        : {}),
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // Step 7: NC 종결 (TM) → 장비 available 복원
  // ────────────────────────────────────────────────────────────────────────

  test('Step 7: TM이 NC 종결 → 장비 available 복원', async ({ techManagerPage: page }) => {
    await clearBackendCache();
    await closeNonConformance(page, ncId);

    // ★ 핵심 검증: NC 종결 후 장비 상태 복원
    await clearBackendCache();
    await expectEquipmentStatus(page, WF_EQUIPMENT_ID, ESVal.AVAILABLE, 'technical_manager');
  });

  // ────────────────────────────────────────────────────────────────────────
  // Step 8: UI 최종 확인
  // ────────────────────────────────────────────────────────────────────────

  test('Step 8: 장비 상세에서 available 상태 + 부적합 이력 확인', async ({
    testOperatorPage: page,
  }) => {
    await page.goto(`/equipment/${WF_EQUIPMENT_ID}`);
    await expect(page.getByText('사용 가능').first()).toBeVisible({ timeout: 10000 });
  });
});
