/**
 * WF-04: 수리 반출 전체 흐름 ★P3
 *
 * 고장 장비를 외부 수리업체에 반출하고, 수리 완료 후 반입.
 *
 * @see docs/workflows/critical-workflows.md WF-04
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
  expectEquipmentStatus,
  extractId,
  resetEquipmentForWorkflow,
  clearBackendCache,
  cleanupSharedPool,
} from './helpers/workflow-helpers';
import { TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';

const WF_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E;

test.describe('WF-04: 수리 반출 전체 흐름', () => {
  test.describe.configure({ mode: 'serial' });

  let checkoutId: string;

  test.beforeAll(async () => {
    await resetEquipmentForWorkflow(WF_EQUIPMENT_ID);
  });

  test.afterAll(async () => {
    await resetEquipmentForWorkflow(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('Step 1: TE가 수리 반출 신청', async ({ testOperatorPage: page }) => {
    const body = await createCheckout(
      page,
      [WF_EQUIPMENT_ID],
      CPVal.REPAIR,
      '삼성전자서비스',
      'WF-04: 고장 수리 반출'
    );
    checkoutId = extractId(body);
  });

  test('Step 2: TM 승인 + 반출 시작 → 장비 checked_out', async ({
    techManagerPage: tmPage,
    testOperatorPage: tePage,
  }) => {
    await clearBackendCache();
    await approveCheckout(tmPage, checkoutId);

    await clearBackendCache();
    await startCheckout(tePage, checkoutId);

    await clearBackendCache();
    await expectEquipmentStatus(tePage, WF_EQUIPMENT_ID, ESVal.CHECKED_OUT);
  });

  test('Step 3: 반입 + 승인 → 장비 available', async ({
    testOperatorPage: tePage,
    techManagerPage: tmPage,
  }) => {
    await clearBackendCache();
    await returnCheckout(tePage, checkoutId, { repairChecked: true, workingStatusChecked: true });

    await clearBackendCache();
    const body = await approveReturn(tmPage, checkoutId);
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.status).toBe(CSVal.RETURN_APPROVED);

    await clearBackendCache();
    await expectEquipmentStatus(tmPage, WF_EQUIPMENT_ID, ESVal.AVAILABLE, 'technical_manager');
  });

  test('Step 4: UI에서 장비 available 확인', async ({ testOperatorPage: page }) => {
    await page.goto(`/equipment/${WF_EQUIPMENT_ID}`);
    await expect(page.getByText('사용 가능').first()).toBeVisible({ timeout: 10000 });
  });
});
