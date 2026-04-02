/**
 * WF-15: 복합 — 부적합 다건 + 장비 상태 복원 조건 ★P2
 *
 * 하나의 장비에 NC 2건 발생 → 1건 해결해도 장비 non_conforming 유지
 * → 모두 해결 시 available 복원.
 *
 * @see docs/workflows/critical-workflows.md WF-15
 */

import { test } from '../shared/fixtures/auth.fixture';
import { EquipmentStatusValues as ESVal } from '@equipment-management/schemas';
import {
  createNonConformance,
  correctNonConformance,
  closeNonConformance,
  expectEquipmentStatus,
  extractId,
  resetEquipmentForWorkflow,
  clearBackendCache,
  cleanupSharedPool,
} from './helpers/workflow-helpers';
import { TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';

const WF_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.HARNESS_COUPLER_SUW_A;

test.describe('WF-15: 복합 NC — 다건 부적합 + 장비 상태 복원 조건', () => {
  test.describe.configure({ mode: 'serial' });

  let nc1Id: string;
  let nc2Id: string;

  test.beforeAll(async () => {
    await resetEquipmentForWorkflow(WF_EQUIPMENT_ID);
  });

  test.afterAll(async () => {
    await resetEquipmentForWorkflow(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('Step 1: NC #1 등록 (measurement_error) → 장비 non_conforming', async ({
    testOperatorPage: page,
  }) => {
    const body = await createNonConformance(
      page,
      WF_EQUIPMENT_ID,
      'measurement_error',
      'WF-15: 측정 오류 발견 #1'
    );
    nc1Id = extractId(body);

    await clearBackendCache();
    await expectEquipmentStatus(page, WF_EQUIPMENT_ID, ESVal.NON_CONFORMING);
  });

  test('Step 2: NC #2 등록 (calibration_failure) → 장비 non_conforming 유지', async ({
    testOperatorPage: page,
  }) => {
    await clearBackendCache();
    const body = await createNonConformance(
      page,
      WF_EQUIPMENT_ID,
      'calibration_failure',
      'WF-15: 교정 실패 발견 #2'
    );
    nc2Id = extractId(body);

    await clearBackendCache();
    await expectEquipmentStatus(page, WF_EQUIPMENT_ID, ESVal.NON_CONFORMING);
  });

  test('Step 3: NC #1 조치 완료 + 종결', async ({
    testOperatorPage: tePage,
    techManagerPage: tmPage,
  }) => {
    await clearBackendCache();
    // measurement_error는 전제조건 없음 → 바로 조치 가능
    await correctNonConformance(tePage, nc1Id, {
      resolutionType: 'other',
      correctionContent: 'WF-15: 측정 오류 원인 분석 및 조치 완료',
      correctionDate: new Date().toISOString().split('T')[0],
    });

    await clearBackendCache();
    await closeNonConformance(tmPage, nc1Id);
  });

  test('Step 4: NC #1 종결 후 장비 여전히 non_conforming (NC #2 열려있음)', async ({
    testOperatorPage: page,
  }) => {
    await clearBackendCache();
    // ★ 핵심 검증: 다른 열린 NC가 있으므로 장비 상태 유지
    await expectEquipmentStatus(page, WF_EQUIPMENT_ID, ESVal.NON_CONFORMING);
  });

  test('Step 5: NC #2 조치 완료 + 종결', async ({
    testOperatorPage: tePage,
    techManagerPage: tmPage,
  }) => {
    await clearBackendCache();
    await correctNonConformance(tePage, nc2Id, {
      resolutionType: 'other',
      correctionContent: 'WF-15: 교정 실패 원인 분석 및 조치 완료',
      correctionDate: new Date().toISOString().split('T')[0],
    });

    await clearBackendCache();
    await closeNonConformance(tmPage, nc2Id);
  });

  test('Step 6: 모든 NC 종결 → 장비 available 복원', async ({ testOperatorPage: page }) => {
    await clearBackendCache();
    // ★ 핵심 검증: 모든 NC 종결 시 장비 available 복원
    await expectEquipmentStatus(page, WF_EQUIPMENT_ID, ESVal.AVAILABLE);
  });
});
