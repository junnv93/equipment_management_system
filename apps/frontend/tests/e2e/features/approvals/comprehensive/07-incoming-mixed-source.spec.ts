/**
 * 승인 관리 - 반입(incoming) 복합 소스
 *
 * 시나리오 4: checkouts(반입 복귀) + equipment_imports(렌탈/공유 반입) 통합 표시
 *
 * incoming 탭은 TM과 LM 모두 접근 가능
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('반입(incoming) 복합 소스', () => {
  test('TC-01: TM incoming 탭 - 목록 렌더링', async ({ techManagerPage: page }) => {
    await page.goto('/admin/approvals?tab=incoming');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const sidebar = page.getByRole('navigation', { name: '승인 카테고리 네비게이션' });
    await expect(sidebar.getByRole('button', { name: /반입/ })).toHaveAttribute(
      'aria-current',
      'page'
    );

    // 빈 상태 또는 목록
    const emptyState = page.getByText('모든 승인을 완료했습니다');
    const approvalList = page.locator('[data-testid="approval-list"]');
    await expect(emptyState.or(approvalList)).toBeVisible({ timeout: 10000 });
  });

  test('TC-02: LM incoming 탭 - 목록 렌더링', async ({ siteAdminPage: page }) => {
    await page.goto('/admin/approvals?tab=incoming');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const sidebar = page.getByRole('navigation', { name: '승인 카테고리 네비게이션' });
    await expect(sidebar.getByRole('button', { name: /반입/ })).toHaveAttribute(
      'aria-current',
      'page'
    );

    const emptyState = page.getByText('모든 승인을 완료했습니다');
    const approvalList = page.locator('[data-testid="approval-list"]');
    await expect(emptyState.or(approvalList)).toBeVisible({ timeout: 10000 });
  });

  test('TC-03: incoming 목록 항목에 승인/반려 버튼 존재', async ({ techManagerPage: page }) => {
    await page.goto('/admin/approvals?tab=incoming');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const approvalList = page.locator('[data-testid="approval-list"]');
    const emptyState = page.getByText('모든 승인을 완료했습니다');
    await expect(emptyState.or(approvalList)).toBeVisible({ timeout: 15000 });

    if (!(await approvalList.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    // 승인/반려 버튼 존재 확인
    const approveBtn = page.getByRole('button', { name: '승인' }).first();
    await expect(approveBtn).toBeVisible();

    const rejectBtn = page.getByRole('button', { name: '반려' }).first();
    await expect(rejectBtn).toBeVisible();
  });
});
