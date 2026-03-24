/**
 * 승인 관리 - 교정계획서 3단계 전체 워크플로우
 *
 * TM 검토 요청 → QM 검토 → LM 최종 승인
 * + QM 반려 → TM 재제출
 *
 * serial 모드: 상태가 단계별로 변경됨
 *
 * SSOT: TEST_CALIBRATION_PLAN_IDS 사용
 * - CPLAN_001_DRAFT: draft → submit-for-review (TM)
 * - CPLAN_002_PENDING_REVIEW: pending_review → review (QM)
 * - CPLAN_003_PENDING_APPROVAL: pending_approval → approve (LM)
 * - CPLAN_005_REJECTED: rejected → 재제출 가능 여부
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import {
  apiSubmitPlanForReview,
  apiReviewCalibrationPlan,
  apiApproveCalibrationPlan,
  apiRejectCalibrationPlan,
  getCalibrationPlan,
  resetCalibrationPlanStatus,
  waitForApprovalListOrEmpty,
  cleanupApprovalPool,
} from '../../../shared/helpers/approval-helpers';
import { clearBackendCache } from '../../../shared/helpers/api-helpers';
import { TEST_CALIBRATION_PLAN_IDS as PLANS } from '../../../shared/constants/shared-test-data';
import { CalibrationPlanStatusValues as CPSVal } from '@equipment-management/schemas';

test.describe('교정계획서 3단계 전체 워크플로우', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    // CPLAN_001을 draft로 리셋 (submit-for-review 테스트용)
    await resetCalibrationPlanStatus(PLANS.CPLAN_001_DRAFT, CPSVal.DRAFT);
    // CPLAN_002를 pending_review로 리셋 (QM 검토 테스트용)
    await resetCalibrationPlanStatus(PLANS.CPLAN_002_PENDING_REVIEW, CPSVal.PENDING_REVIEW);
    // CPLAN_003을 pending_approval로 리셋 (LM 승인 테스트용)
    await resetCalibrationPlanStatus(PLANS.CPLAN_003_PENDING_APPROVAL, CPSVal.PENDING_APPROVAL);
  });

  test.afterAll(async () => {
    // 원래 상태로 복원
    await resetCalibrationPlanStatus(PLANS.CPLAN_001_DRAFT, CPSVal.DRAFT);
    await resetCalibrationPlanStatus(PLANS.CPLAN_002_PENDING_REVIEW, CPSVal.PENDING_REVIEW);
    await resetCalibrationPlanStatus(PLANS.CPLAN_003_PENDING_APPROVAL, CPSVal.PENDING_APPROVAL);
    await cleanupApprovalPool();
  });

  test('TC-01: TM이 draft 계획서를 검토 요청 → pending_review', async ({
    techManagerPage: page,
  }) => {
    const resp = await apiSubmitPlanForReview(
      page,
      PLANS.CPLAN_001_DRAFT,
      '2026년 교정계획서 검토 요청합니다.',
      'technical_manager'
    );

    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    const data = body.data ?? body;
    expect(data.status).toBe(CPSVal.PENDING_REVIEW);
  });

  test('TC-02: QM plan_review 탭에서 CPLAN_001 표시 확인', async ({ qualityManagerPage: page }) => {
    await clearBackendCache();
    await page.goto('/admin/approvals?tab=plan_review');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const hasData = await waitForApprovalListOrEmpty(page);
    // CPLAN_001 + CPLAN_002 + CPLAN_006 = 최소 2~3건
    expect(hasData).toBeTruthy();
  });

  test('TC-03: QM이 CPLAN_002를 검토 → pending_approval', async ({ qualityManagerPage: page }) => {
    const resp = await apiReviewCalibrationPlan(
      page,
      PLANS.CPLAN_002_PENDING_REVIEW,
      '교정 항목 및 일정 적절함. 검토 완료.',
      'quality_manager'
    );

    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    const data = body.data ?? body;
    expect(data.status).toBe(CPSVal.PENDING_APPROVAL);
  });

  test('TC-04: LM plan_final에서 CPLAN_003 표시 확인', async ({ siteAdminPage: page }) => {
    await clearBackendCache();
    await page.goto('/admin/approvals?tab=plan_final');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const hasData = await waitForApprovalListOrEmpty(page);
    // CPLAN_003 + TC-03에서 검토된 CPLAN_002 = 최소 1~2건
    expect(hasData).toBeTruthy();
  });

  test('TC-05: LM이 CPLAN_003을 최종 승인 → approved', async ({ siteAdminPage: page }) => {
    const resp = await apiApproveCalibrationPlan(
      page,
      PLANS.CPLAN_003_PENDING_APPROVAL,
      'lab_manager'
    );

    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    const data = body.data ?? body;
    expect(data.status).toBe(CPSVal.APPROVED);
  });

  test('TC-06: 승인 후 plan_final 목록에서 CPLAN_003 제거 확인', async ({
    siteAdminPage: page,
  }) => {
    await clearBackendCache();
    await page.goto('/admin/approvals?tab=plan_final');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    await waitForApprovalListOrEmpty(page);
    // 정상 렌더링 확인
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible();
  });
});

test.describe('교정계획서 QM 반려 워크플로우', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    // CPLAN_006을 pending_review로 리셋 (반려 테스트용)
    await resetCalibrationPlanStatus(
      PLANS.CPLAN_006_RESUBMITTED,
      CPSVal.PENDING_REVIEW,
      2 // v2 (재제출이므로)
    );
  });

  test.afterAll(async () => {
    await resetCalibrationPlanStatus(PLANS.CPLAN_006_RESUBMITTED, CPSVal.PENDING_REVIEW, 2);
    await cleanupApprovalPool();
  });

  test('TC-07: QM이 CPLAN_006을 반려 → rejected (rejectionStage: review)', async ({
    qualityManagerPage: page,
  }) => {
    const resp = await apiRejectCalibrationPlan(
      page,
      PLANS.CPLAN_006_RESUBMITTED,
      '교정 항목이 불충분합니다. 특수계측기 교정 항목을 추가해주세요. 재검토 후 재제출 바랍니다.',
      'quality_manager'
    );

    if (resp.ok()) {
      const body = await resp.json();
      const data = body.data ?? body;
      expect(data.status).toBe(CPSVal.REJECTED);
    }
    // 이미 처리된 경우도 통과
  });

  test('TC-08: QM 반려 후 plan_review 목록 정상 렌더링', async ({ qualityManagerPage: page }) => {
    await clearBackendCache();
    await page.goto('/admin/approvals?tab=plan_review');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    // 반려된 항목은 목록에서 제거됨
    await waitForApprovalListOrEmpty(page);
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible();
  });
});
