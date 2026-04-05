/**
 * WF-18: 부적합 조치 반려 (corrected → open 복귀) ★P2
 *
 * NC 조치 완료 후 TM이 반려하면 open으로 복귀.
 * 재조치 후 종결하면 장비 상태가 available로 복원.
 *
 * @see docs/workflows/critical-workflows.md WF-18
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import { EquipmentStatusValues as ESVal } from '@equipment-management/schemas';
import {
  createNonConformance,
  correctNonConformance,
  rejectCorrection,
  closeNonConformance,
  expectEquipmentStatus,
  extractId,
  apiGet,
  resetEquipmentForWorkflow,
  clearBackendCache,
  cleanupSharedPool,
} from './helpers/workflow-helpers';
import { TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';

/** WF-18 전용 — MULTIMETER_SUW_R (TE 팀 소속) */
const WF_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.MULTIMETER_SUW_R;

test.describe('WF-18: 부적합 조치 반려 → open 복귀 → ��조치 → 종결', () => {
  test.describe.configure({ mode: 'serial' });

  let ncId: string;

  test.beforeAll(async () => {
    await resetEquipmentForWorkflow(WF_EQUIPMENT_ID);
  });

  test.afterAll(async () => {
    await resetEquipmentForWorkflow(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('Step 1: TE가 부적합 등록 + 조치 완료', async ({ testOperatorPage: page }) => {
    const ncBody = await createNonConformance(
      page,
      WF_EQUIPMENT_ID,
      'measurement_error',
      'WF-18 ��스트: 측정 오차 발견'
    );
    ncId = extractId(ncBody);

    await clearBackendCache();
    await expectEquipmentStatus(page, WF_EQUIPMENT_ID, ESVal.NON_CONFORMING);

    await correctNonConformance(page, ncId, {
      resolutionType: 'recalibration',
      correctionContent: 'WF-18: 재교정 수행 완료',
      correctionDate: new Date().toISOString().split('T')[0],
    });
  });

  test('Step 2: TM이 조치 반려 → NC open 복귀 + 장비 non_conforming 유지', async ({
    techManagerPage: page,
  }) => {
    await clearBackendCache();
    const body = await rejectCorrection(page, ncId, 'WF-18: 교정 성적서 미첨부, 보완 필요');
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.status).toBe('open');

    // WF-18 Step 3: 장비 상태 non_conforming 복귀 확인
    await clearBackendCache();
    await expectEquipmentStatus(page, WF_EQUIPMENT_ID, ESVal.NON_CONFORMING, 'technical_manager');
  });

  test('Step 3: TE가 재조치', async ({ testOperatorPage: page }) => {
    await clearBackendCache();
    await correctNonConformance(page, ncId, {
      resolutionType: 'recalibration',
      correctionContent: 'WF-18: 재교정 + ��적서 첨부 완료',
      correctionDate: new Date().toISOString().split('T')[0],
    });

    const resp = await apiGet(page, `/api/non-conformances/${ncId}`, 'test_engineer');
    const body = await resp.json();
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.status).toBe('corrected');
  });

  test('Step 4: TM이 종결 → NC closed, 장비 available', async ({ techManagerPage: page }) => {
    await clearBackendCache();
    await closeNonConformance(page, ncId);

    await clearBackendCache();
    await expectEquipmentStatus(page, WF_EQUIPMENT_ID, ESVal.AVAILABLE, 'technical_manager');
  });
});
