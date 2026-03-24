/**
 * 승인 관리 - 벌크 처리 (일괄 승인/반려)
 *
 * 시나리오 3-벌크: 전체 선택 → 일괄 승인/반려
 * 시나리오 9-탭변경: 탭 변경 시 선택 항목 초기화
 *
 * BulkActionBar: 전체 선택 체크박스, 일괄 승인 확인 다이얼로그, 일괄 반려 사유 입력
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { waitForApprovalListOrEmpty } from '../../../shared/helpers/approval-helpers';

test.describe('벌크 처리 - UI 동작', () => {
  test('TC-01: 전체 선택 체크박스 동작', async ({ techManagerPage: page }) => {
    await page.goto('/admin/approvals?tab=outgoing');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const hasData = await waitForApprovalListOrEmpty(page);
    if (!hasData) {
      test.skip();
      return;
    }

    // 전체 선택 체크박스 확인 (Checkbox + Label 연결)
    const selectAllCheckbox = page.locator('#select-all');
    await expect(selectAllCheckbox).toBeVisible();

    // 전체 선택 클릭
    await selectAllCheckbox.click({ force: true });

    // 일괄 승인/반려 버튼이 활성화됨
    const bulkApproveBtn = page.getByRole('button', { name: /일괄 승인/ });
    const bulkRejectBtn = page.getByRole('button', { name: /일괄 반려/ });
    await expect(bulkApproveBtn).toBeEnabled();
    await expect(bulkRejectBtn).toBeEnabled();

    // 전체 해제 (aria-label이 "전체 해제"로 변경됨)
    await selectAllCheckbox.click({ force: true });

    // 버튼 비활성화
    await expect(bulkApproveBtn).toBeDisabled();
    await expect(bulkRejectBtn).toBeDisabled();
  });

  test('TC-02: 일괄 승인 확인 다이얼로그', async ({ techManagerPage: page }) => {
    await page.goto('/admin/approvals?tab=outgoing');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const hasData = await waitForApprovalListOrEmpty(page);
    if (!hasData) {
      test.skip();
      return;
    }

    // 전체 선택
    await page.locator('#select-all').click({ force: true });

    // 일괄 승인 버튼 클릭
    await page.getByRole('button', { name: /일괄 승인/ }).click();

    // 확인 다이얼로그 표시
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();

    // "일괄 승인 확인" 제목
    await expect(dialog.getByText(/일괄.*승인.*확인/)).toBeVisible();

    // 취소 버튼으로 닫기
    await dialog.getByRole('button', { name: '취소' }).click();
    await expect(dialog).not.toBeVisible();
  });

  test('TC-03: 일괄 반려 - 사유 입력 필수 (10자 미만 차단)', async ({ techManagerPage: page }) => {
    await page.goto('/admin/approvals?tab=outgoing');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const hasData = await waitForApprovalListOrEmpty(page);
    if (!hasData) {
      test.skip();
      return;
    }

    // 전체 선택
    await page.locator('#select-all').click({ force: true });

    // 일괄 반려 클릭
    await page.getByRole('button', { name: /일괄 반려/ }).click();

    // 반려 다이얼로그 표시
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();

    // 짧은 사유 입력
    const reasonInput = dialog.locator('textarea');
    await reasonInput.fill('짧은사유');

    // 반려 버튼이 비활성화 (10자 미만)
    const rejectActionBtn = dialog.getByRole('button', { name: /반려/ }).last();
    await expect(rejectActionBtn).toBeDisabled();

    // 검증 메시지 표시
    await expect(dialog.getByRole('alert')).toBeVisible();
    await expect(dialog.getByRole('alert')).toBeVisible();

    // 10자 이상 입력하면 활성화
    await reasonInput.fill('이것은 충분히 긴 반려 사유입니다 테스트');
    await expect(rejectActionBtn).toBeEnabled();

    // 취소
    await dialog.getByRole('button', { name: '취소' }).click();
  });

  test('TC-04: 탭 변경 시 선택 항목 초기화', async ({ techManagerPage: page }) => {
    await page.goto('/admin/approvals?tab=outgoing');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const sidebar = page.getByRole('navigation', { name: '승인 카테고리 네비게이션' });

    const hasData = await waitForApprovalListOrEmpty(page);

    if (hasData) {
      // 전체 선택
      await page.locator('#select-all').click({ force: true });
      const bulkApproveBtn = page.getByRole('button', { name: /일괄 승인/ });
      await expect(bulkApproveBtn).toBeEnabled();
    }

    // 탭 변경: 반출 → 장비
    await sidebar.getByRole('button', { name: /장비/ }).click();
    await expect(page).toHaveURL(/tab=equipment/);

    // 장비 탭 로딩 대기
    await waitForApprovalListOrEmpty(page);

    // 선택 상태 초기화됨 — 일괄 버튼이 비활성화 상태
    const bulkApproveBtn = page.getByRole('button', { name: /일괄 승인/ });
    if (await bulkApproveBtn.isVisible().catch(() => false)) {
      await expect(bulkApproveBtn).toBeDisabled();
    }
  });

  test('TC-05: 소프트웨어 탭 - 벌크 승인 시 코멘트 다이얼로그', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/admin/approvals?tab=software');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const hasData = await waitForApprovalListOrEmpty(page);
    if (!hasData) {
      test.skip();
      return;
    }

    // 전체 선택
    await page.locator('#select-all').click({ force: true });

    // 일괄 검토완료 클릭 → BulkActionBar 확인 다이얼로그 표시
    await page.getByRole('button', { name: /일괄 검토완료/ }).click();

    // 1단계: AlertDialog 확인 다이얼로그
    const alertDialog = page.getByRole('alertdialog');
    await expect(alertDialog).toBeVisible();

    // 확인 버튼 클릭 → commentRequired이므로 코멘트 다이얼로그가 열림
    await alertDialog.getByRole('button', { name: '검토완료' }).click();

    // 2단계: 코멘트 다이얼로그 표시
    const commentDialog = page.getByRole('dialog');
    await expect(commentDialog).toBeVisible();

    // "검토 코멘트" 라벨 존재
    await expect(commentDialog.getByLabel('검토 코멘트')).toBeVisible();

    // 코멘트 없이는 제출 불가
    const submitBtn = commentDialog.getByRole('button', { name: /검토완료/ });
    await expect(submitBtn).toBeDisabled();

    // 취소
    await commentDialog.getByRole('button', { name: '취소' }).click();
  });
});
