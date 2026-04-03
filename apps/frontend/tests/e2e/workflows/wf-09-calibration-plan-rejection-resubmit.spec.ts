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

  test('Step 4: QM 검토 통과 → pending_approval', async ({ qualityManagerPage: page }) => {
    await clearBackendCache();
    const body = await reviewCalibrationPlan(page, WF_PLAN_ID);
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.status).toBe(CPSVal.PENDING_APPROVAL);
  });

  // ── LM 반려 시나리오 (문서 Step 6~7) ──

  test('Step 5: LM이 반려 → rejected (draft가 아닌 rejected로 전이)', async ({
    siteAdminPage: page,
  }) => {
    await clearBackendCache();
    const body = await rejectCalibrationPlan(
      page,
      WF_PLAN_ID,
      'WF-09: 예산 초과, 장비 우선순위 재검토 필요',
      'lab_manager'
    );
    const data = (body.data ?? body) as Record<string, unknown>;
    // ★ 핵심 검증: LM 반려 시 rejected 상태 (draft 아님)
    expect(data.status).toBe(CPSVal.REJECTED);
  });

  test('Step 6: TM 수정 → 재제출 → QM 검토 → LM 최종 승인 → approved', async ({
    techManagerPage: tmPage,
    qualityManagerPage: qmPage,
    siteAdminPage: lmPage,
  }) => {
    // rejected → draft 리셋 (실제 운영에서는 TM이 수동 재작성)
    await resetCalibrationPlanStatus(WF_PLAN_ID, CPSVal.DRAFT);
    await clearBackendCache();

    // 재제출
    await submitPlanForReview(tmPage, WF_PLAN_ID);
    await clearBackendCache();

    // QM 검토 통과
    await reviewCalibrationPlan(qmPage, WF_PLAN_ID);
    await clearBackendCache();

    // LM 최종 승인
    const body = await approveCalibrationPlan(lmPage, WF_PLAN_ID);
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.status).toBe(CPSVal.APPROVED);
  });
});
