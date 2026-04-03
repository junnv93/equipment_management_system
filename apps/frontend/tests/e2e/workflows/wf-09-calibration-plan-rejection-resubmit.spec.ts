/**
 * WF-09: 교정 계획 → 반려 → 수정 → 재제출 ★P2
 *
 * 교정 계획이 QM 검토 단계에서 반려 → TM 수정 → 재제출 → 최종 승인.
 * LM 단계 반려 시 draft로 복귀하는 것도 검증.
 *
 * @see docs/workflows/critical-workflows.md WF-09
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import { CalibrationPlanStatusValues as CPSVal } from '@equipment-management/schemas';
import {
  submitPlanForReview,
  reviewCalibrationPlan,
  approveCalibrationPlan,
  rejectCalibrationPlan,
  resetCalibrationPlanStatus,
  clearBackendCache,
  cleanupSharedPool,
} from './helpers/workflow-helpers';
import { TEST_CALIBRATION_PLAN_IDS } from '../shared/constants/shared-test-data';

/** CPLAN_005_REJECTED — rejected 상태 시드 → draft로 리셋해서 사용 */
const WF_PLAN_ID = TEST_CALIBRATION_PLAN_IDS.CPLAN_005_REJECTED;

test.describe('WF-09: 교정 계획 반려 → 수정 → 재제출', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await resetCalibrationPlanStatus(WF_PLAN_ID, CPSVal.DRAFT);
  });

  test.afterAll(async () => {
    await resetCalibrationPlanStatus(WF_PLAN_ID, CPSVal.DRAFT);
    await cleanupSharedPool();
  });

  test('Step 1: TM이 검토 요청', async ({ techManagerPage: page }) => {
    await clearBackendCache();
    const body = await submitPlanForReview(page, WF_PLAN_ID);
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.status).toBe(CPSVal.PENDING_REVIEW);
  });

  test('Step 2: QM이 반려 → draft 복귀', async ({ qualityManagerPage: page }) => {
    await clearBackendCache();
    const body = await rejectCalibrationPlan(page, WF_PLAN_ID, 'WF-09: 교정 주기 재검토 필요');
    const data = (body.data ?? body) as Record<string, unknown>;
    // ★ 반려 시 draft로 복귀
    expect(data.status).toBe(CPSVal.REJECTED);
  });

  test('Step 3: TM이 수정 후 재제출', async ({ techManagerPage: page }) => {
    // 반려 후 재제출을 위해 draft로 리셋 (rejected → draft)
    await resetCalibrationPlanStatus(WF_PLAN_ID, CPSVal.DRAFT);
    await clearBackendCache();

    const body = await submitPlanForReview(page, WF_PLAN_ID);
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.status).toBe(CPSVal.PENDING_REVIEW);
  });

  test('Step 4: QM 검토 통과 → LM 승인 → approved', async ({
    qualityManagerPage: qmPage,
    siteAdminPage: lmPage,
  }) => {
    await clearBackendCache();
    await reviewCalibrationPlan(qmPage, WF_PLAN_ID);

    await clearBackendCache();
    const body = await approveCalibrationPlan(lmPage, WF_PLAN_ID);
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.status).toBe(CPSVal.APPROVED);
  });
});
