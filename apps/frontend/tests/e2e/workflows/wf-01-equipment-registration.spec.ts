/**
 * WF-01: 장비 등록 전체 흐름 ★P3
 *
 * 시험실무자가 장비를 등록하고, 목록/상세에서 확인.
 *
 * @see docs/workflows/critical-workflows.md WF-01
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import {
  apiPost,
  apiGet,
  extractId,
  clearBackendCache,
  cleanupSharedPool,
  getSharedPool,
} from './helpers/workflow-helpers';
import { TEST_TEAM_IDS } from '../shared/constants/shared-test-data';

test.describe('WF-01: 장비 등록 전체 흐름', () => {
  test.describe.configure({ mode: 'serial' });

  let equipmentId: string;

  test.afterAll(async () => {
    // 동적 생성 장비 삭제
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
        name: `WF-01 테스트 장비 ${Date.now()}`,
        classification: 'fcc_emc_rf',
        site: 'suwon',
        teamId: TEST_TEAM_IDS.FCC_EMC_RF_SUWON,
        manufacturer: '테스트 제조사',
        modelNumber: 'WF-01-MODEL',
        calibrationRequired: 'required',
        calibrationCycle: 12,
      },
      'test_engineer'
    );
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    equipmentId = extractId(body);
    expect(equipmentId).toBeTruthy();
  });

  test('Step 2: 장비 목록에서 조회 가능', async ({ testOperatorPage: page }) => {
    await clearBackendCache();
    await page.goto('/equipment');
    await expect(page.getByText('WF-01 테스트 장비').first()).toBeVisible({ timeout: 15000 });
  });

  test('Step 3: 장비 상세에서 정보 정확', async ({ testOperatorPage: page }) => {
    await page.goto(`/equipment/${equipmentId}`);
    await expect(page.getByText('WF-01 테스트 장비').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('사용 가능').first()).toBeVisible();
  });

  test('Step 4: 관리번호 자동 생성 확인', async ({ testOperatorPage: page }) => {
    const resp = await apiGet(page, `/api/equipment/${equipmentId}`, 'test_engineer');
    const body = await resp.json();
    const data = (body.data ?? body) as Record<string, unknown>;
    const mgmtNum = data.managementNumber as string;
    // SUW-E 패턴
    expect(mgmtNum).toMatch(/^SUW-E\d{4}$/);
  });
});
