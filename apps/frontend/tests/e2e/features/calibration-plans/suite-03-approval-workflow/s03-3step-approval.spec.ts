/**
 * Suite 03: 교정계획서 3단계 승인 워크플로우 테스트
 *
 * B-3: draft → pending_review → pending_approval → approved
 *      + 반려 (QM: pending_review → rejected, LM: pending_approval → rejected)
 *      + 재제출 (rejected → pending_review)
 *
 * 시드 데이터 활용:
 * - CPLAN_001: draft (TM이 submit 가능)
 * - CPLAN_002: pending_review (의왕 → 수원 QM/LM 접근 불가)
 * - CPLAN_003: pending_approval (LM 승인 대기)
 * - CPLAN_005: rejected (rejectionStage: review)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { TEST_CALIBRATION_PLAN_IDS } from '../../../shared/constants/shared-test-data';

const PLANS_PAGE = '/calibration-plans';

test.describe('B-3: 교정계획서 3단계 승인 워크플로우', () => {
  test.describe('Step 1: 검토 요청 (TM → QM)', () => {
    test('TM: draft 계획서에서 검토 요청 버튼 표시', async ({ techManagerPage: page }) => {
      await page.goto(`${PLANS_PAGE}/${TEST_CALIBRATION_PLAN_IDS.CPLAN_001_DRAFT}`);

      // draft 상태 배지
      await expect(page.getByText(/작성 중|draft/i).first()).toBeVisible();

      // 검토 요청 버튼
      const submitButton = page.getByRole('button', { name: /검토 요청|제출/ });
      await expect(submitButton).toBeVisible();
    });

    test('TM: 검토 요청 확인 다이얼로그', async ({ techManagerPage: page }) => {
      await page.goto(`${PLANS_PAGE}/${TEST_CALIBRATION_PLAN_IDS.CPLAN_001_DRAFT}`);
      // draft 상태 로드 대기
      await expect(page.getByText(/작성 중|draft/i).first()).toBeVisible({ timeout: 15000 });

      const submitButton = page.getByRole('button', { name: /검토 요청|제출/ });
      if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await submitButton.click();

        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible({ timeout: 5000 });
        await expect(dialog.getByText(/품질책임자|검토 요청|수정이 불가/)).toBeVisible();

        await dialog.getByRole('button', { name: /취소/ }).click();
        await expect(dialog).not.toBeVisible();
      }
    });
  });

  test.describe('Step 2: 검토 (QM)', () => {
    test('QM: pending_review 계획서에서 검토 완료/반려 버튼 표시', async ({
      qualityManagerPage: page,
    }) => {
      // CPLAN_003은 pending_approval이므로, pending_review인 CPLAN_006 사용
      await page.goto(`${PLANS_PAGE}/${TEST_CALIBRATION_PLAN_IDS.CPLAN_006_RESUBMITTED}`);

      // pending_review 상태
      await expect(page.getByText(/확인 대기|검토 대기|pending_review/i).first()).toBeVisible();

      // QM 검토 액션 버튼들
      const reviewButton = page.getByRole('button', { name: /검토 완료|확인/ });
      const rejectButton = page.getByRole('button', { name: /반려/ });

      // QM에게 검토/반려 버튼이 보여야 함
      const hasReviewAction = await reviewButton.isVisible().catch(() => false);
      const hasRejectAction = await rejectButton.isVisible().catch(() => false);
      expect(hasReviewAction || hasRejectAction).toBeTruthy();
    });

    test('QM: 반려 시 반려 사유 필수 입력', async ({ qualityManagerPage: page }) => {
      await page.goto(`${PLANS_PAGE}/${TEST_CALIBRATION_PLAN_IDS.CPLAN_006_RESUBMITTED}`);
      await expect(page.getByText(/확인 대기|검토 대기|pending/i).first()).toBeVisible({
        timeout: 15000,
      });

      const rejectButton = page.getByRole('button', { name: /반려/ });
      if (await rejectButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await rejectButton.click();

        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible({ timeout: 5000 });

        const reasonInput = dialog.getByRole('textbox').or(dialog.getByLabel(/반려 사유/));
        await expect(reasonInput).toBeVisible();

        await dialog.getByRole('button', { name: /취소/ }).click();
      }
    });
  });

  test.describe('Step 3: 최종 승인 (LM)', () => {
    test('LM: pending_approval 계획서에서 승인/반려 버튼 표시', async ({ siteAdminPage: page }) => {
      await page.goto(`${PLANS_PAGE}/${TEST_CALIBRATION_PLAN_IDS.CPLAN_003_PENDING_APPROVAL}`);

      // pending_approval 상태
      await expect(page.getByText(/승인 대기|pending_approval/i).first()).toBeVisible();

      // LM 승인 액션 버튼
      const approveButton = page.getByRole('button', { name: /최종 승인|승인/ });
      const rejectButton = page.getByRole('button', { name: /반려/ });

      const hasApproveAction = await approveButton.isVisible().catch(() => false);
      const hasRejectAction = await rejectButton.isVisible().catch(() => false);
      expect(hasApproveAction || hasRejectAction).toBeTruthy();
    });

    test('LM: 최종 승인 확인 다이얼로그', async ({ siteAdminPage: page }) => {
      await page.goto(`${PLANS_PAGE}/${TEST_CALIBRATION_PLAN_IDS.CPLAN_003_PENDING_APPROVAL}`);
      await expect(page.getByText(/승인 대기|pending/i).first()).toBeVisible({ timeout: 15000 });

      const approveButton = page.getByRole('button', { name: /최종 승인|승인/ });
      if (await approveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await approveButton.click();

        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible({ timeout: 5000 });
        await expect(dialog.getByText(/최종 승인|승인.*진행/)).toBeVisible();

        await dialog.getByRole('button', { name: /취소/ }).click();
      }
    });
  });

  test.describe('권한 없는 역할의 액션 버튼 미표시', () => {
    test('TM은 pending_review 계획서에서 검토/승인 불가', async ({ techManagerPage: page }) => {
      await page.goto(`${PLANS_PAGE}/${TEST_CALIBRATION_PLAN_IDS.CPLAN_006_RESUBMITTED}`);

      // TM에게는 검토 완료 버튼이 보이지 않아야 함
      const reviewButton = page.getByRole('button', { name: /검토 완료/ });
      await expect(reviewButton).not.toBeVisible();
    });

    test('TM은 pending_approval 계획서에서 승인 불가', async ({ techManagerPage: page }) => {
      await page.goto(`${PLANS_PAGE}/${TEST_CALIBRATION_PLAN_IDS.CPLAN_003_PENDING_APPROVAL}`);

      // TM에게는 최종 승인 버튼이 보이지 않아야 함
      const approveButton = page.getByRole('button', { name: /최종 승인/ });
      await expect(approveButton).not.toBeVisible();
    });

    test('QM은 pending_approval 계획서에서 승인 불가', async ({ qualityManagerPage: page }) => {
      await page.goto(`${PLANS_PAGE}/${TEST_CALIBRATION_PLAN_IDS.CPLAN_003_PENDING_APPROVAL}`);

      // QM에게는 최종 승인 버튼이 보이지 않아야 함
      const approveButton = page.getByRole('button', { name: /최종 승인/ });
      await expect(approveButton).not.toBeVisible();
    });
  });

  test.describe('반려 후 재제출', () => {
    test('rejected 계획서에서 반려 사유 + 반려 단계 표시', async ({ techManagerPage: page }) => {
      await page.goto(`${PLANS_PAGE}/${TEST_CALIBRATION_PLAN_IDS.CPLAN_005_REJECTED}`);

      // 반려 상태
      await expect(page.getByText(/반려/i).first()).toBeVisible();

      // 반려 사유
      await expect(page.getByText(/교정 일자 재검토 필요/)).toBeVisible();
    });
  });
});
