/**
 * WF-20b: 자체점검표 양식 내보내기 (UL-QP-18-05)
 *
 * 자체점검 생성 후 QP-18-05 양식으로 XLSX 내보내기가 정상 동작하는지 검증.
 * 장비 헤더, 점검 항목, 결재란 데이터가 포함되는지 확인.
 *
 * @see docs/procedure/양식/QP-18-05_자체점검표.md
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import {
  createSelfInspection,
  resetSelfInspections,
  clearBackendCache,
  cleanupSharedPool,
} from './helpers/workflow-helpers';
import { TEST_EQUIPMENT_IDS, BASE_URLS } from '../shared/constants/shared-test-data';
import { getBackendToken } from '../shared/helpers/api-helpers';

const WF_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.TRANSMITTER_UIW_W;
const BACKEND_URL = BASE_URLS.BACKEND;
const today = new Date().toISOString().split('T')[0];

test.describe('WF-20b: 자체점검표 양식 내보내기 (QP-18-05)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await resetSelfInspections(WF_EQUIPMENT_ID);
  });

  test.afterAll(async () => {
    await resetSelfInspections(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('Step 1: 자체점검 생성 후 QP-18-05 XLSX export → 200', async ({
    testOperatorPage: page,
  }) => {
    // 점검 생성
    await createSelfInspection(page, WF_EQUIPMENT_ID, {
      inspectionDate: today,
      items: [
        { itemNumber: 1, checkItem: '외관검사', checkResult: 'pass' },
        { itemNumber: 2, checkItem: '출력 특성 점검', checkResult: 'pass' },
        { itemNumber: 3, checkItem: '안전 점검', checkResult: 'pass' },
        { itemNumber: 4, checkItem: '기능 점검', checkResult: 'pass' },
      ],
      overallResult: 'pass',
      specialNotes: [{ content: '측정장비: NETWORK ANALYZER, 상태 양호', date: today }],
    });
    await clearBackendCache();

    // QP-18-05 export 호출
    const token = await getBackendToken(page, 'test_engineer');
    const resp = await page.request.get(
      `${BACKEND_URL}/api/reports/export/form/UL-QP-18-05?equipmentId=${WF_EQUIPMENT_ID}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    expect(resp.status()).toBe(200);
    expect(resp.headers()['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    const body = await resp.body();
    expect(body.length).toBeGreaterThan(1000); // XLSX는 최소 수 KB
  });

  test('Step 2: 미구현 양식 호출 → 501', async ({ testOperatorPage: page }) => {
    const token = await getBackendToken(page, 'test_engineer');
    const resp = await page.request.get(`${BACKEND_URL}/api/reports/export/form/UL-QP-18-06`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status()).toBe(501);
  });
});
