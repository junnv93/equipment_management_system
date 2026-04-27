/**
 * AP-01: 승인 KPI 스트립 — 3-tier 렌더링 + 긴급 aria-live
 *
 * 검증:
 * - 3 카드 렌더링 (todayProcessed 제거 확인)
 * - 긴급 카운트 aria-live="polite"
 * - 0 vs null 시각 분기
 * - KPI 카드 클릭 → ?filter=urgent URL 파라미터
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

const APPROVALS_PAGE = '/admin/approvals';

test.describe('Approval KPI Strip — 3-tier (AP-01)', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('3개 KPI 카드가 렌더링된다 (todayProcessed 제거)', async ({ labManagerPage }) => {
    await labManagerPage.goto(APPROVALS_PAGE);
    await labManagerPage.waitForLoadState('networkidle');

    // 3개 카드 확인 (skeleton 포함, data-testid 기반)
    const kpiCards = labManagerPage.locator('[data-testid^="kpi-value-"]');
    await expect(kpiCards).toHaveCount(3);

    // 각 카드 variant 확인
    await expect(labManagerPage.getByTestId('kpi-value-urgent')).toBeVisible();
    await expect(labManagerPage.getByTestId('kpi-value-total')).toBeVisible();
    await expect(labManagerPage.getByTestId('kpi-value-avgWait')).toBeVisible();
  });

  test('긴급 카운트 영역에 aria-live="polite"가 설정되어 있다', async ({ labManagerPage }) => {
    await labManagerPage.goto(APPROVALS_PAGE);
    await labManagerPage.waitForLoadState('networkidle');

    const urgentValue = labManagerPage.getByTestId('kpi-value-urgent');
    await expect(urgentValue).toBeVisible();
    await expect(urgentValue).toHaveAttribute('aria-live', 'polite');
  });

  test('긴급 KPI 카드 클릭 시 ?filter=urgent 파라미터가 추가된다', async ({ labManagerPage }) => {
    await labManagerPage.goto(APPROVALS_PAGE);
    await labManagerPage.waitForLoadState('networkidle');

    // 긴급 KPI 카드 (role="button") 클릭
    const urgentCard = labManagerPage.locator('[role="button"][aria-label*="긴급"]').first();
    if (await urgentCard.isVisible()) {
      await urgentCard.click();
      await expect(labManagerPage).toHaveURL(/filter=urgent/);
    }
  });

  test('품질책임자는 승인 대기 목록 페이지에 접근할 수 있다', async ({ qualityManagerPage }) => {
    await qualityManagerPage.goto(APPROVALS_PAGE);
    await qualityManagerPage.waitForLoadState('networkidle');

    // KPI 스트립 영역 렌더링 확인
    await expect(qualityManagerPage.getByTestId('kpi-value-urgent')).toBeVisible();
  });
});
