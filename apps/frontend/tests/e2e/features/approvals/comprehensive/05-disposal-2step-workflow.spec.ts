/**
 * 승인 관리 - 폐기 2단계 승인 워크플로우 (종합)
 *
 * 시나리오 5: pending → reviewed (TM) → approved (LM)
 *             + ApprovalStepIndicator 3개 노드
 *             + disposal_review: commentRequired
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { waitForApprovalListOrEmpty } from '../../../shared/helpers/approval-helpers';

test.describe('폐기 2단계 승인 - 탭 및 StepIndicator', () => {
  test('TC-01: TM disposal_review 탭 + StepIndicator', async ({ techManagerPage: page }) => {
    await page.goto('/admin/approvals?tab=disposal_review');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const sidebar = page.getByRole('navigation', { name: '승인 카테고리 네비게이션' });
    await expect(sidebar.getByRole('button', { name: /폐기 검토/ })).toHaveAttribute(
      'aria-current',
      'page'
    );

    const hasData = await waitForApprovalListOrEmpty(page);

    if (hasData) {
      // StepIndicator 존재 확인
      const stepIndicators = page.locator('[data-testid="step-indicator"]');
      const count = await stepIndicators.count();
      if (count > 0) {
        const firstIndicator = stepIndicators.first();
        await expect(firstIndicator.getByText('요청')).toBeVisible();
        await expect(firstIndicator.getByText('검토')).toBeVisible();
        await expect(firstIndicator.getByText('승인')).toBeVisible();
      }
    }
  });

  test('TC-02: TM disposal_review - 검토완료 시 코멘트 필수 (상세 모달 경유)', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/admin/approvals?tab=disposal_review');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const hasData = await waitForApprovalListOrEmpty(page);
    if (!hasData) {
      test.skip();
      return;
    }

    // 상세 모달 열기
    const firstItem = page.locator('[data-testid="approval-item"]').first();
    await firstItem.getByRole('button', { name: /상세 보기/ }).click();

    const detailDialog = page.getByRole('dialog');
    await expect(detailDialog).toBeVisible();

    // "검토완료" 버튼 클릭 → 코멘트 다이얼로그가 열림 (commentRequired: true)
    await detailDialog.getByRole('button', { name: '검토완료' }).click();

    // 상세 모달이 닫히고 코멘트 다이얼로그가 열림
    const commentDialog = page.getByRole('dialog');
    await expect(commentDialog).toBeVisible();
    await expect(commentDialog.getByText('폐기 검토 의견')).toBeVisible();

    // 코멘트 없이 제출 불가
    const submitBtn = commentDialog.getByRole('button', { name: '검토완료' });
    await expect(submitBtn).toBeDisabled();

    // 취소
    await commentDialog.getByRole('button', { name: '취소' }).click();
  });

  test('TC-03: LM disposal_final 탭 렌더링', async ({ siteAdminPage: page }) => {
    await page.goto('/admin/approvals?tab=disposal_final');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const sidebar = page.getByRole('navigation', { name: '승인 카테고리 네비게이션' });
    await expect(sidebar.getByRole('button', { name: /폐기 승인/ })).toHaveAttribute(
      'aria-current',
      'page'
    );

    const hasData = await waitForApprovalListOrEmpty(page);

    if (hasData) {
      const stepIndicators = page.locator('[data-testid="step-indicator"]');
      const count = await stepIndicators.count();
      if (count > 0) {
        const firstIndicator = stepIndicators.first();
        await expect(firstIndicator.getByText('요청')).toBeVisible();
        await expect(firstIndicator.getByText('검토')).toBeVisible();
        await expect(firstIndicator.getByText('승인')).toBeVisible();
      }
    }
  });

  test('TC-04: ApprovalStepIndicator - 역할 표시', async ({ techManagerPage: page }) => {
    await page.goto('/admin/approvals?tab=disposal_review');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const hasData = await waitForApprovalListOrEmpty(page);
    if (!hasData) {
      test.skip();
      return;
    }

    const stepIndicator = page.locator('[data-testid="step-indicator"]').first();
    if (await stepIndicator.isVisible().catch(() => false)) {
      await expect(stepIndicator.getByText('시험실무자')).toBeVisible();
      await expect(stepIndicator.getByText('기술책임자')).toBeVisible();
      await expect(stepIndicator.getByText('시험소장')).toBeVisible();
    }
  });
});
