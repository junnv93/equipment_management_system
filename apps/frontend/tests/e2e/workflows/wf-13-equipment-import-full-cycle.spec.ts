/**
 * WF-13: 대여 반입(Equipment Import) 전체 흐름 ★P1
 *
 * 외부 장비 반입 → 승인 → 수령(장비 자동 생성) → 반납 요청(checkout 자동 생성).
 *
 * @see docs/workflows/critical-workflows.md WF-13
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import {
  createEquipmentImport,
  approveEquipmentImport,
  receiveEquipmentImport,
  initiateImportReturn,
  approveCheckout,
  startCheckout,
  returnCheckout,
  approveReturn,
  extractId,
  apiGet,
  resetEquipmentImports,
  clearBackendCache,
  cleanupSharedPool,
} from './helpers/workflow-helpers';
import { TEST_TEAM_IDS } from '../shared/constants/shared-test-data';

test.describe('WF-13: 대여 반입 전체 흐름', () => {
  test.describe.configure({ mode: 'serial' });

  let importId: string;
  let createdEquipmentId: string;
  let returnCheckoutId: string;

  test.afterAll(async () => {
    await resetEquipmentImports();
    await cleanupSharedPool();
  });

  test('Step 1: TE가 반입 신청', async ({ testOperatorPage: page }) => {
    const body = await createEquipmentImport(
      page,
      {
        sourceType: 'rental',
        vendorName: `WF 테스트 렌탈 업체 ${Date.now()}`,
        teamId: TEST_TEAM_IDS.FCC_EMC_RF_SUWON,
        site: 'suwon',
        classification: 'fcc_emc_rf',
        expectedDuration: 90,
        equipmentDetails: [
          {
            equipmentName: 'WF-13 테스트 장비',
            manufacturer: '테스트 제조사',
            modelNumber: 'WF-13-MODEL',
          },
        ],
      },
      'test_engineer'
    );
    importId = extractId(body);
    expect(importId).toBeTruthy();
  });

  test('Step 2: TM이 반입 승인', async ({ techManagerPage: page }) => {
    await clearBackendCache();
    await approveEquipmentImport(page, importId);
  });

  test('Step 3: TE가 수령 처리 → 임시 장비 자동 생성', async ({ testOperatorPage: page }) => {
    await clearBackendCache();
    await receiveEquipmentImport(page, importId);

    // ★ 임시 장비 자동 생성 확인
    const importResp = await apiGet(page, `/api/equipment-imports/${importId}`, 'test_engineer');
    const importBody = await importResp.json();
    const importData = (importBody.data ?? importBody) as Record<string, unknown>;
    createdEquipmentId = importData.equipmentId as string;
    expect(createdEquipmentId).toBeTruthy();
  });

  test('Step 4: 자동 생성된 장비 확인', async ({ testOperatorPage: page }) => {
    expect(createdEquipmentId).toBeTruthy();
    const resp = await apiGet(page, `/api/equipment/${createdEquipmentId}`, 'test_engineer');
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    const data = (body.data ?? body) as Record<string, unknown>;
    // TEMP- 프리픽스 관리번호
    expect((data.managementNumber as string).startsWith('TEMP-')).toBeTruthy();
  });

  test('Step 5: TE가 반납 요청 → checkout 자동 생성', async ({ testOperatorPage: page }) => {
    await clearBackendCache();
    await initiateImportReturn(page, importId);

    // ★ 반납 checkout 자동 생성 확인
    await clearBackendCache();
    const importResp = await apiGet(page, `/api/equipment-imports/${importId}`, 'test_engineer');
    const importBody = await importResp.json();
    const importData = (importBody.data ?? importBody) as Record<string, unknown>;
    expect(importData.returnCheckoutId).toBeTruthy();
    returnCheckoutId = importData.returnCheckoutId as string;
  });

  test('Step 6: TM이 반납 반출 승인', async ({ techManagerPage: page }) => {
    expect(returnCheckoutId).toBeTruthy();
    await clearBackendCache();
    const body = await approveCheckout(page, returnCheckoutId);
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.status).toBe('approved');
  });

  test('Step 7: 반출 시작 + 반입 처리 + 반입 승인', async ({
    testOperatorPage: tePage,
    techManagerPage: tmPage,
  }) => {
    await clearBackendCache();
    await startCheckout(tePage, returnCheckoutId);

    await clearBackendCache();
    await returnCheckout(tePage, returnCheckoutId, { workingStatusChecked: true });

    await clearBackendCache();
    await approveReturn(tmPage, returnCheckoutId);
  });

  test('Step 8: 최종 확인 — 반입 상태 returned', async ({ testOperatorPage: page }) => {
    await clearBackendCache();
    const importResp = await apiGet(page, `/api/equipment-imports/${importId}`, 'test_engineer');
    expect(importResp.ok()).toBeTruthy();
    const importBody = await importResp.json();
    const importData = (importBody.data ?? importBody) as Record<string, unknown>;
    // ★ 반납 완료 후 import 상태가 returned
    expect(importData.status).toBe('returned');
  });
});
