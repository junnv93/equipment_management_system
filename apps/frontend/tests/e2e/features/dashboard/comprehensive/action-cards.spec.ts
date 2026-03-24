/**
 * 대시보드 종합 E2E 테스트 — 시나리오 6, 7, 8: PendingApproval + OverdueCheckouts + CalibrationDday
 *
 * 시나리오 6: PendingApprovalCard — 역할별 제목, 카테고리 클릭, 사이드바 배지 동기화
 * 시나리오 7: OverdueCheckoutsCard — 2개 탭 (기한 초과/반납 예정), 반출 상세 링크
 * 시나리오 8: CalibrationDdayList — D-day 색상, 장비 상세 이동, "더보기" 링크
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('시나리오 6: PendingApprovalCard', () => {
  test('TC-18: technical_manager — "팀 승인 대기" 제목 + 카테고리 표시', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/');
    const card = page.getByTestId('pending-approval-card');
    await expect(card).toBeVisible({ timeout: 10000 });

    // 카드 제목: "팀 승인 대기"
    await expect(card.locator('#pending-approval-title')).toContainText('팀 승인 대기');

    // 카테고리 링크들 (aria-label에 "{카테고리} N건" 형식)
    const categoryLinks = card.locator('a[aria-label]');
    const linkCount = await categoryLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  test('TC-19: lab_manager — "시험소 승인 대기" 제목', async ({ siteAdminPage: page }) => {
    await page.goto('/');
    const card = page.getByTestId('pending-approval-card');
    await expect(card).toBeVisible({ timeout: 10000 });

    await expect(card.locator('#pending-approval-title')).toContainText('시험소 승인 대기');
  });

  test('TC-20: 카테고리 클릭 시 /admin/approvals?tab={category} 이동', async ({
    siteAdminPage: page,
  }) => {
    await page.goto('/');
    const card = page.getByTestId('pending-approval-card');
    await expect(card).toBeVisible({ timeout: 10000 });

    // 첫 번째 카테고리 링크의 href 확인
    const firstLink = card.locator('a[aria-label]').first();
    const href = await firstLink.getAttribute('href');
    expect(href).toContain('/admin/approvals');
    expect(href).toMatch(/tab=/);

    // 클릭 후 이동 확인
    await firstLink.click();
    await expect(page).toHaveURL(/\/admin\/approvals.*tab=/);
  });

  test('TC-21: 전체 보기 버튼 표시 + 클릭 이동', async ({ siteAdminPage: page }) => {
    await page.goto('/');
    const card = page.getByTestId('pending-approval-card');
    await expect(card).toBeVisible({ timeout: 10000 });

    // "전체 보기" 링크/버튼
    const viewAll = card.getByRole('link', { name: /전체 보기/ });
    const viewAllVisible = await viewAll.isVisible().catch(() => false);

    if (viewAllVisible) {
      await viewAll.click();
      await expect(page).toHaveURL(/\/admin\/approvals/);
    }
  });
});

test.describe('시나리오 7: OverdueCheckoutsCard', () => {
  test('TC-22: 2개 내부 탭 — "기한 초과" / "반납 예정"', async ({ techManagerPage: page }) => {
    await page.goto('/');
    const card = page.locator('[aria-label="반출 현황 목록"]');
    await expect(card).toBeVisible({ timeout: 10000 });

    // 카드 제목: "반출 현황"
    await expect(card.getByText('반출 현황').first()).toBeVisible();

    // 2개 탭 (role="tab") — 텍스트에 "(N)" 건수 포함
    const overdueTab = card.getByRole('tab', { name: /기한 초과/ });
    const upcomingTab = card.getByRole('tab', { name: /반납 예정/ });
    await expect(overdueTab).toBeVisible();
    await expect(upcomingTab).toBeVisible();
  });

  test('TC-23: "기한 초과" 탭 — D+ 배지 + 상세 링크', async ({ siteAdminPage: page }) => {
    await page.goto('/');
    const card = page.locator('[aria-label="반출 현황 목록"]');
    await expect(card).toBeVisible({ timeout: 10000 });

    // 기한 초과 탭 클릭 (기본 선택일 수 있음)
    const overdueTab = card.getByRole('tab', { name: /기한 초과/ });
    await overdueTab.click();

    // D+ 배지 또는 빈 상태 확인
    const hasDPlus = await card
      .getByText(/D\+\d+/)
      .first()
      .isVisible()
      .catch(() => false);
    const hasEmpty = await card
      .getByText(/기한 초과 없음/)
      .isVisible()
      .catch(() => false);

    expect(hasDPlus || hasEmpty).toBe(true);

    if (hasDPlus) {
      // 상세 보기 링크 확인
      const detailLink = card.locator('a').first();
      const href = await detailLink.getAttribute('href');
      expect(href).toContain('/checkouts/');
    }
  });

  test('TC-24: "반납 예정" 탭 — D- 배지 표시', async ({ siteAdminPage: page }) => {
    await page.goto('/');
    const card = page.locator('[aria-label="반출 현황 목록"]');
    await expect(card).toBeVisible({ timeout: 10000 });

    // 반납 예정 탭 클릭
    const upcomingTab = card.getByRole('tab', { name: /반납 예정/ });
    await upcomingTab.click();

    // D- 배지 또는 빈 상태 확인
    const hasDMinus = await card
      .getByText(/D-\d+/)
      .first()
      .isVisible()
      .catch(() => false);
    const hasEmpty = await card
      .getByText(/반납 예정 장비가 없습니다/)
      .isVisible()
      .catch(() => false);

    expect(hasDMinus || hasEmpty).toBe(true);
  });
});

test.describe('시나리오 8: CalibrationDdayList', () => {
  test('TC-25: 교정 현황 리스트 렌더링 — 초과/예정 통합', async ({ siteAdminPage: page }) => {
    await page.goto('/');
    const list = page.locator('[aria-label="교정 현황 컴팩트 리스트"]');
    await expect(list).toBeVisible({ timeout: 10000 });

    // 제목: "교정 현황"
    await expect(list.getByText('교정 현황').first()).toBeVisible();

    // 초과 건수 또는 예정 건수 배지 (빈 상태일 수도 있음)
    const hasOverdueCount = await list
      .getByText(/\d+건 초과/)
      .isVisible()
      .catch(() => false);
    const hasUpcomingCount = await list
      .getByText(/\d+건 예정/)
      .isVisible()
      .catch(() => false);
    const hasEmpty = await list
      .getByText('교정 이슈 없음')
      .isVisible()
      .catch(() => false);

    expect(hasOverdueCount || hasUpcomingCount || hasEmpty).toBe(true);
  });

  test('TC-26: D-day 항목 클릭 시 장비 상세 페이지 이동', async ({ siteAdminPage: page }) => {
    await page.goto('/');
    const list = page.locator('[aria-label="교정 현황 컴팩트 리스트"]');
    await expect(list).toBeVisible({ timeout: 10000 });

    // 장비 링크가 있으면 클릭
    const equipmentLink = list.locator('a[href*="/equipment/"]').first();
    const hasLink = await equipmentLink.isVisible().catch(() => false);

    if (hasLink) {
      const href = await equipmentLink.getAttribute('href');
      expect(href).toMatch(/\/equipment\/[a-f0-9-]+/);
      await equipmentLink.click();
      await expect(page).toHaveURL(/\/equipment\/[a-f0-9-]+/);
    }
  });

  test('TC-27: "전체 보기" 링크 표시', async ({ siteAdminPage: page }) => {
    await page.goto('/');
    const list = page.locator('[aria-label="교정 현황 컴팩트 리스트"]');
    await expect(list).toBeVisible({ timeout: 10000 });

    // "전체 보기" 링크가 데이터가 있을 때 표시됨
    const hasOverdue = await list
      .getByText(/\d+건 초과/)
      .isVisible()
      .catch(() => false);
    const hasUpcoming = await list
      .getByText(/\d+건 예정/)
      .isVisible()
      .catch(() => false);

    if (hasOverdue || hasUpcoming) {
      // 전체 보기 링크가 하나 이상 있어야 함
      const viewAll = list.getByRole('link').first();
      await expect(viewAll).toBeVisible();
    }
  });
});
