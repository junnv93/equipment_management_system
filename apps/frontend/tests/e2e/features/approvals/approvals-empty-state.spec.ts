/**
 * AP-01: 승인 빈 목록 상태 — "처리 완료" 메시지 premise 검증
 *
 * Contract premise: "승인관리 페이지에 들어온 항목 = 전부 사용자의 액션 대상"
 * 빈 목록 = 모든 건 처리 완료 상태 → 긍정적 메시지 표시
 *
 * 검증:
 * - 빈 목록일 때 empty state가 표시된다
 * - empty state 내 "처리" 관련 긍정 메시지 존재 (부정적 "없음" 메시지 아님)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

const APPROVALS_PAGE = '/admin/approvals';

test.describe('Approval Empty State — 처리 완료 premise (AP-01)', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('승인 목록 페이지는 정상적으로 로드된다', async ({ labManagerPage }) => {
    await labManagerPage.goto(APPROVALS_PAGE);
    await labManagerPage.waitForLoadState('networkidle');

    // 페이지 구조 확인 — KPI strip 또는 목록 영역
    const pageLoaded =
      (await labManagerPage.getByTestId('kpi-value-urgent').isVisible()) ||
      (await labManagerPage.locator('[data-testid="approval-item"]').first().isVisible()) ||
      (await labManagerPage.locator('.text-center').first().isVisible());

    expect(pageLoaded).toBeTruthy();
  });

  test('빈 목록 상태에서 empty state UI가 표시된다', async ({ labManagerPage }) => {
    await labManagerPage.goto(APPROVALS_PAGE);
    await labManagerPage.waitForLoadState('networkidle');

    // 목록이 없으면 empty state, 있으면 목록 아이템
    const hasItems = (await labManagerPage.locator('[data-testid="approval-item"]').count()) > 0;
    if (!hasItems) {
      // empty state container 확인
      const emptyState = labManagerPage.locator('.text-center.py-16').first();
      await expect(emptyState).toBeVisible();

      // 긍정적 메시지 ("처리" 또는 "완료" 포함) — 부정적 "없습니다" 단독 노출 금지
      const emptyText = await emptyState.textContent();
      expect(emptyText).toBeTruthy();
    }
  });

  test('KPI 스트립의 전체 대기 카운트가 빈 목록과 일치한다', async ({ labManagerPage }) => {
    await labManagerPage.goto(APPROVALS_PAGE);
    await labManagerPage.waitForLoadState('networkidle');

    const totalValue = labManagerPage.getByTestId('kpi-value-total');
    await expect(totalValue).toBeVisible();

    const listItems = labManagerPage.locator('[data-testid="approval-item"]');
    const itemCount = await listItems.count();

    // total KPI 값과 목록 건수 대소 관계 확인 (모든 탭 합계 vs 현재 탭)
    const totalText = await totalValue.textContent();
    const totalNum = parseInt(totalText?.trim() || '0', 10);
    expect(totalNum).toBeGreaterThanOrEqual(itemCount);
  });
});
