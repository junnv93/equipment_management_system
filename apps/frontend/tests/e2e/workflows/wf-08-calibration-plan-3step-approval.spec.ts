/**
 * WF-08: 교정 계획 → 3단계 승인 ★P1
 *
 * 기술책임자가 교정 계획을 작성하고, 품질책임자 검토 + 시험소장 승인.
 *
 * @see docs/workflows/critical-workflows.md WF-08
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import { CalibrationPlanStatusValues as CPSVal } from '@equipment-management/schemas';
import {
  submitPlanForReview,
  reviewCalibrationPlan,
  approveCalibrationPlan,
  apiGet,
  resetCalibrationPlanStatus,
  clearBackendCache,
  cleanupSharedPool,
} from './helpers/workflow-helpers';
import { TEST_CALIBRATION_PLAN_IDS } from '../shared/constants/shared-test-data';

/** 워크플로우 전용 — CPLAN_001_DRAFT (draft 상태 시드 데이터) */
const WF_PLAN_ID = TEST_CALIBRATION_PLAN_IDS.CPLAN_001_DRAFT;

test.describe('WF-08: 교정 계획 3단계 승인', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await resetCalibrationPlanStatus(WF_PLAN_ID, CPSVal.DRAFT);
  });

  test.afterAll(async () => {
    await resetCalibrationPlanStatus(WF_PLAN_ID, CPSVal.DRAFT);
    await cleanupSharedPool();
  });

  test('Step 1: 초기 상태 draft 확인', async ({ techManagerPage: page }) => {
    const resp = await apiGet(page, `/api/calibration-plans/${WF_PLAN_ID}`, 'technical_manager');
    const body = await resp.json();
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.status).toBe(CPSVal.DRAFT);
  });

  test('Step 2: TM이 검토 요청 → pending_review', async ({ techManagerPage: page }) => {
    await clearBackendCache();
    const body = await submitPlanForReview(page, WF_PLAN_ID);
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.status).toBe(CPSVal.PENDING_REVIEW);
  });

  test('Step 3: QM이 검토 완료 → pending_approval', async ({ qualityManagerPage: page }) => {
    await clearBackendCache();
    const body = await reviewCalibrationPlan(page, WF_PLAN_ID);
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.status).toBe(CPSVal.PENDING_APPROVAL);
  });

  test('Step 4: LM이 최종 승인 → approved', async ({ siteAdminPage: page }) => {
    await clearBackendCache();
    const body = await approveCalibrationPlan(page, WF_PLAN_ID);
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.status).toBe(CPSVal.APPROVED);
  });

  test('Step 5: UI에서 승인 완료 상태 확인', async ({ techManagerPage: page }) => {
    await page.goto(`/calibration-plans/${WF_PLAN_ID}`);
    await expect(page.getByText('승인').first()).toBeVisible({ timeout: 10000 });
  });
});
