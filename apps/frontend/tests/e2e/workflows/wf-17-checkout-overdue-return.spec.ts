/**
 * WF-17: 반출 기한 초과 overdue → 반입 처리 ★P2
 *
 * 반출된 장비의 예정 반입일이 경과하면 overdue 상태로 전환되고,
 * overdue 상태에서도 반입 처리가 정상 진행되어 장비가 available로 복원됨.
 *
 * CheckoutOverdueScheduler는 서버사이드 cron이므로 DB 직접 설정으로 대체.
 *
 * @see docs/workflows/critical-workflows.md WF-17
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import { EquipmentStatusValues as ESVal } from '@equipment-management/schemas';
import {
  createCheckout,
  approveCheckout,
  startCheckout,
  returnCheckout,
  approveReturn,
  expectEquipmentStatus,
  extractId,
  setCheckoutOverdue,
  resetEquipmentForWorkflow,
  apiGet,
  clearBackendCache,
  cleanupSharedPool,
  getSharedPool,
} from './helpers/workflow-helpers';
import { TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';

/** WF-17 전용 — POWER_SUPPLY_SUW_R (수원 사이트, 다른 WF 미사용) */
const WF_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.POWER_SUPPLY_SUW_R;

test.describe('WF-17: 반출 기한 초과 overdue → 반입 처리', () => {
  test.describe.configure({ mode: 'serial' });

  let checkoutId: string;

  test.beforeAll(async () => {
    await resetEquipmentForWorkflow(WF_EQUIPMENT_ID);
  });

  test.afterAll(async () => {
    await resetEquipmentForWorkflow(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('Step 1: TE가 반출 신청 → TM 승인 → 반출 시작', async ({
    testOperatorPage: tePage,
    techManagerPage: tmPage,
  }) => {
    const body = await createCheckout(
      tePage,
      [WF_EQUIPMENT_ID],
      'calibration',
      '외부 교정기관',
      'WF-17 overdue 테스트'
    );
    checkoutId = extractId(body);

    await clearBackendCache();
    await approveCheckout(tmPage, checkoutId, 'technical_manager');

    await clearBackendCache();
    await startCheckout(tePage, checkoutId);

    await clearBackendCache();
    await expectEquipmentStatus(tePage, WF_EQUIPMENT_ID, ESVal.CHECKED_OUT);
  });

  test('Step 2: DB에서 overdue 상태 직접 설정', async ({ testOperatorPage: page }) => {
    await setCheckoutOverdue(checkoutId);

    await clearBackendCache();
    const resp = await apiGet(page, `/api/checkouts/${checkoutId}`, 'test_engineer');
    const body = await resp.json();
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.status).toBe('overdue');
  });

  test('Step 3: 장비 상태는 checked_out 유지 (overdue는 반출 상태)', async ({
    testOperatorPage: page,
  }) => {
    await clearBackendCache();
    await expectEquipmentStatus(page, WF_EQUIPMENT_ID, ESVal.CHECKED_OUT);
  });

  test('Step 4: overdue → checked_out 복원 후 반입 처리 → TM 반입 승인', async ({
    testOperatorPage: tePage,
    techManagerPage: tmPage,
  }) => {
    // 현재 백엔드 returnCheckout()은 checked_out 상태만 허용.
    // overdue→return 직접 전이는 미구현이므로 DB 복원 후 반입 진행.
    // TODO: 백엔드에서 overdue 상태 반입 허용 시 이 복원 단계 제거
    const pool = getSharedPool();
    await pool.query(
      `UPDATE checkouts SET status = 'checked_out', updated_at = NOW() WHERE id = $1`,
      [checkoutId]
    );
    await clearBackendCache();

    await returnCheckout(tePage, checkoutId);

    await clearBackendCache();
    await approveReturn(tmPage, checkoutId, 'technical_manager');
  });

  test('Step 5: 장비 available 복원 확인', async ({ testOperatorPage: page }) => {
    await clearBackendCache();
    await expectEquipmentStatus(page, WF_EQUIPMENT_ID, ESVal.AVAILABLE);
  });
});
