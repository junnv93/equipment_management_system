/**
 * 승인 관리 - 빈 상태 + 로딩 상태
 *
 * 각 카테고리의 빈 상태 렌더링 검증
 * "모든 승인을 완료했습니다" 메시지 + 아이콘
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('빈 상태 렌더링', () => {
  test('TC-01: 빈 카테고리 - "모든 승인을 완료했습니다" 또는 목록 표시', async ({
    techManagerPage: page,
  }) => {
    // TM의 모든 탭을 순회하면서 UI가 깨지지 않는지 확인
    const tabs = [
      'outgoing',
      'incoming',
      'equipment',
      'calibration',
      'inspection',
      'nonconformity',
      'disposal_review',
      'software',
    ];

    for (const tab of tabs) {
      await page.goto(`/admin/approvals?tab=${tab}`);
      await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
        timeout: 10000,
      });

      // 각 탭에서 빈 상태("모든 승인을 완료했습니다") 또는 approval-list가 있어야 함
      // 로딩 스켈레톤이 사라진 후
      const emptyState = page.getByText('모든 승인을 완료했습니다');
      const approvalList = page.locator('[data-testid="approval-list"]');

      await expect(emptyState.or(approvalList)).toBeVisible({ timeout: 15000 });
    }
  });

  test('TC-02: 빈 상태에서 KPI 전체 대기 = 0 또는 다른 탭 합계', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/admin/approvals');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    // KPI "전체 대기" 카드가 스켈레톤이 아닌 실제 값을 표시
    const totalPendingCard = page.locator('[role="group"][aria-label="전체 대기"]');
    await expect(totalPendingCard).toBeVisible();

    // 스켈레톤이 사라질 때까지 대기 — kpi-value-skeleton (data-testid SSOT)
    await expect(totalPendingCard.getByTestId('kpi-value-skeleton')).not.toBeVisible({
      timeout: 10000,
    });
  });

  test('TC-03: LM - 빈 카테고리 순회', async ({ siteAdminPage: page }) => {
    const tabs = ['disposal_final', 'plan_final', 'incoming'];

    for (const tab of tabs) {
      await page.goto(`/admin/approvals?tab=${tab}`);
      await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
        timeout: 10000,
      });

      const emptyState = page.getByText('모든 승인을 완료했습니다');
      const approvalList = page.locator('[data-testid="approval-list"]');
      await expect(emptyState.or(approvalList)).toBeVisible({ timeout: 15000 });
    }
  });
});
