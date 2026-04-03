/**
 * WF-02: 장비 등록 → 승인 → 반려 → 재등록 ★P3
 *
 * 장비 등록 후 승인자가 반려하고, 수정 후 재제출하여 최종 승인.
 * 참고: 현재 구현에서 장비 등록은 즉시 available이므로,
 * 이 테스트는 장비 수정 → 반려 시나리오로 대체.
 *
 * @see docs/workflows/critical-workflows.md WF-02
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import {
  apiPost,
  apiGet,
  apiPatch,
  extractId,
  extractVersion,
  clearBackendCache,
  cleanupSharedPool,
  getSharedPool,
} from './helpers/workflow-helpers';
import { TEST_TEAM_IDS } from '../shared/constants/shared-test-data';

test.describe('WF-02: 장비 등록 + 수정 흐름', () => {
  test.describe.configure({ mode: 'serial' });

  let equipmentId: string;

  test.afterAll(async () => {
    if (equipmentId) {
      const pool = getSharedPool();
      await pool.query(`DELETE FROM equipment WHERE id = $1`, [equipmentId]);
      await clearBackendCache();
    }
    await cleanupSharedPool();
  });

  test('Step 1: TE가 장비 등록', async ({ testOperatorPage: page }) => {
    const resp = await apiPost(
      page,
      '/api/equipment',
      {
        name: `WF-02 테스트 장비 ${Date.now()}`,
        classification: 'fcc_emc_rf',
        site: 'suwon',
        teamId: TEST_TEAM_IDS.FCC_EMC_RF_SUWON,
        manufacturer: '테스트 제조사',
        modelNumber: 'WF-02-MODEL',
        calibrationRequired: 'required',
        calibrationCycle: 12,
      },
      'test_engineer'
    );
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    equipmentId = extractId(body);
  });

  test('Step 2: TE가 장비 정보 수정', async ({ testOperatorPage: page }) => {
    await clearBackendCache();
    const resp = await apiGet(page, `/api/equipment/${equipmentId}`, 'test_engineer');
    const body = await resp.json();
    const version = extractVersion(body);

    const patchResp = await apiPatch(
      page,
      `/api/equipment/${equipmentId}`,
      {
        version,
        name: `WF-02 수정된 장비 ${Date.now()}`,
        manufacturer: '수정된 제조사',
      },
      'test_engineer'
    );
    expect(patchResp.ok()).toBeTruthy();
  });

  test('Step 3: 수정 사항 상세 페이지에서 확인', async ({ testOperatorPage: page }) => {
    await clearBackendCache();
    await page.goto(`/equipment/${equipmentId}`);
    await expect(page.getByText('WF-02 수정된 장비').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('수정된 제조사').first()).toBeVisible();
  });
});
