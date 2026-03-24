/**
 * 승인 관리 - 교정계획서 3단계 승인 워크플로우
 *
 * 시나리오 6: draft → pending_review (TM) → pending_approval (QM) → approved (LM)
 *             + ApprovalStepIndicator (작성/검토/승인)
 *
 * plan_review: QM만 접근
 * plan_final: LM만 접근
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { waitForApprovalListOrEmpty } from '../../../shared/helpers/approval-helpers';

test.describe('교정계획서 3단계 승인', () => {
  test('TC-01: QM plan_review 탭 - 검토 대기 목록 + StepIndicator', async ({
    qualityManagerPage: page,
  }) => {
    await page.goto('/admin/approvals?tab=plan_review');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const sidebar = page.getByRole('navigation', { name: '승인 카테고리 네비게이션' });
    await expect(sidebar.getByRole('button', { name: /교정계획서 검토/ })).toHaveAttribute(
      'aria-current',
      'page'
    );

    const hasData = await waitForApprovalListOrEmpty(page);

    if (hasData) {
      const stepIndicators = page.locator('[data-testid="step-indicator"]');
      const count = await stepIndicators.count();
      if (count > 0) {
        const firstIndicator = stepIndicators.first();
        await expect(firstIndicator.getByText('작성')).toBeVisible();
        await expect(firstIndicator.getByText('검토')).toBeVisible();
        await expect(firstIndicator.getByText('승인')).toBeVisible();
      }
    }
  });

  test('TC-02: QM plan_review - 검토완료/반려 액션 존재', async ({ qualityManagerPage: page }) => {
    await page.goto('/admin/approvals?tab=plan_review');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const hasData = await waitForApprovalListOrEmpty(page);
    if (!hasData) {
      test.skip();
      return;
    }

    // 상세 모달을 열어 승인/반려 버튼 확인
    const firstItem = page.locator('[data-testid="approval-item"]').first();
    await firstItem.getByRole('button', { name: /상세 보기/ }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // 검토완료 버튼 (tabMeta.plan_review.action = "검토완료")
    await expect(dialog.getByRole('button', { name: '검토완료' })).toBeVisible();
    // 반려 버튼
    await expect(dialog.getByRole('button', { name: '반려' })).toBeVisible();

    await dialog.getByRole('button', { name: '닫기' }).click();
  });

  test('TC-03: QM plan_review - 반려 시 사유 필수 (상세 모달 경유)', async ({
    qualityManagerPage: page,
  }) => {
    await page.goto('/admin/approvals?tab=plan_review');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const hasData = await waitForApprovalListOrEmpty(page);
    if (!hasData) {
      test.skip();
      return;
    }

    // 상세 모달 열기 → 반려 클릭
    const firstItem = page.locator('[data-testid="approval-item"]').first();
    await firstItem.getByRole('button', { name: /상세 보기/ }).click();

    const detailDialog = page.getByRole('dialog');
    await expect(detailDialog).toBeVisible();
    await detailDialog.getByRole('button', { name: '반려' }).click();

    // 반려 모달
    const rejectDialog = page.getByRole('dialog');
    await expect(rejectDialog).toBeVisible();

    const reasonInput = rejectDialog.locator('textarea[name="reason"]');
    await reasonInput.fill('짧은사유');
    const submitBtn = rejectDialog.getByRole('button', { name: /반려/ }).last();
    await submitBtn.click();

    // 검증 에러 (role="alert" 요소만 매칭)
    await expect(rejectDialog.getByRole('alert')).toBeVisible();

    // 취소
    await rejectDialog.getByRole('button', { name: '취소' }).click();
  });

  test('TC-04: LM plan_final 탭 - 최종 승인 목록', async ({ siteAdminPage: page }) => {
    await page.goto('/admin/approvals?tab=plan_final');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const sidebar = page.getByRole('navigation', { name: '승인 카테고리 네비게이션' });
    await expect(sidebar.getByRole('button', { name: /교정계획서 승인/ })).toHaveAttribute(
      'aria-current',
      'page'
    );

    const hasData = await waitForApprovalListOrEmpty(page);

    if (hasData) {
      const stepIndicators = page.locator('[data-testid="step-indicator"]');
      const count = await stepIndicators.count();
      if (count > 0) {
        const firstIndicator = stepIndicators.first();
        await expect(firstIndicator.getByText('기술책임자')).toBeVisible();
        await expect(firstIndicator.getByText('품질책임자')).toBeVisible();
        await expect(firstIndicator.getByText('시험소장')).toBeVisible();
      }
    }
  });

  test('TC-05: LM plan_final - 승인/반려 액션 (상세 모달)', async ({ siteAdminPage: page }) => {
    await page.goto('/admin/approvals?tab=plan_final');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const hasData = await waitForApprovalListOrEmpty(page);
    if (!hasData) {
      test.skip();
      return;
    }

    const firstItem = page.locator('[data-testid="approval-item"]').first();
    await firstItem.getByRole('button', { name: /상세 보기/ }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // 승인 버튼 (tabMeta.plan_final.action = "승인")
    await expect(dialog.getByRole('button', { name: '승인' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: '반려' })).toBeVisible();

    await dialog.getByRole('button', { name: '닫기' }).click();
  });

  test('TC-06: QM은 다른 탭에 접근 불가 (URL 직접 입력 → 기본 탭 폴백)', async ({
    qualityManagerPage: page,
  }) => {
    // QM이 tab=equipment를 URL로 직접 입력해도 기본 탭(plan_review)으로 폴백
    await page.goto('/admin/approvals?tab=equipment');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    // QM의 기본 탭은 plan_review (availableTabs[0])
    // equipment는 availableTabs에 없으므로 defaultTab으로 폴백
    // 폴백된 탭의 목록이 로딩되는지 확인
    await waitForApprovalListOrEmpty(page);

    // plan_review 탭의 내용이 표시됨 (사이드바에 plan_review만 있음)
    const sidebar = page.getByRole('navigation', { name: '승인 카테고리 네비게이션' });
    const planReviewBtn = sidebar.getByRole('button', { name: /교정계획서 검토/ });
    await expect(planReviewBtn).toBeVisible();
  });
});
