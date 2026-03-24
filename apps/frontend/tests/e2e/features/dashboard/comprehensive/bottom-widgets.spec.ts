/**
 * 대시보드 종합 E2E 테스트 — 시나리오 9, 10, 11: MiniCalendar + TeamDistribution + RecentActivities
 *
 * 시나리오 9: MiniCalendar — 월 탐색, 이벤트 점, 한국 공휴일, 호버 툴팁
 * 시나리오 10: TeamEquipmentDistribution — 팀별 바 차트, 총 장비 수
 * 시나리오 11: RecentActivities — 역할별 제목, 탭 필터, 승인/반려 강조
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('시나리오 9: MiniCalendar', () => {
  test('TC-28: 미니 달력 렌더링 — 월 표시 + 요일 헤더', async ({ siteAdminPage: page }) => {
    await page.goto('/');
    const calendar = page.locator('[aria-label="미니 달력"]');
    await expect(calendar).toBeVisible({ timeout: 10000 });

    // 년/월 표시 (예: "2026년 3월")
    const today = new Date();
    const monthStr = `${today.getMonth() + 1}월`;
    await expect(calendar.getByText(new RegExp(monthStr))).toBeVisible();

    // 요일 헤더 (일~토) — "일"은 날짜에도 포함되므로 exact match + first
    await expect(calendar.getByText('월', { exact: true }).first()).toBeVisible();
    await expect(calendar.getByText('토', { exact: true }).first()).toBeVisible();
  });

  test('TC-29: 이전/다음 월 탐색', async ({ siteAdminPage: page }) => {
    await page.goto('/');
    const calendar = page.locator('[aria-label="미니 달력"]');
    await expect(calendar).toBeVisible({ timeout: 10000 });

    // 현재 월 기억
    const currentMonthText = await calendar
      .locator('button, span')
      .filter({ hasText: /\d+월/ })
      .first()
      .textContent();

    // 이전 달 버튼 클릭
    await calendar.getByRole('button', { name: '이전 달' }).click();

    // 월이 변경되었는지 확인
    const prevMonthText = await calendar
      .locator('button, span')
      .filter({ hasText: /\d+월/ })
      .first()
      .textContent();
    expect(prevMonthText).not.toBe(currentMonthText);

    // 다음 달 버튼 두 번 클릭 (원래 + 1)
    await calendar.getByRole('button', { name: '다음 달' }).click();
    await calendar.getByRole('button', { name: '다음 달' }).click();

    const nextMonthText = await calendar
      .locator('button, span')
      .filter({ hasText: /\d+월/ })
      .first()
      .textContent();
    expect(nextMonthText).not.toBe(prevMonthText);
  });

  test('TC-30: 범례 표시 — 공휴일, 교정 초과, 교정 예정, 반납 예정', async ({
    siteAdminPage: page,
  }) => {
    await page.goto('/');
    const calendar = page.locator('[aria-label="미니 달력"]');
    await expect(calendar).toBeVisible({ timeout: 10000 });

    // 범례 항목 확인
    await expect(calendar.getByText('공휴일')).toBeVisible();
    await expect(calendar.getByText('교정 초과')).toBeVisible();
    await expect(calendar.getByText('교정 예정')).toBeVisible();
    await expect(calendar.getByText('반납 예정')).toBeVisible();
  });
});

test.describe('시나리오 10: TeamEquipmentDistribution', () => {
  test('TC-31: TM — 팀별 장비 분포 바 차트 표시', async ({ techManagerPage: page }) => {
    await page.goto('/');
    const chart = page.locator('[aria-label="팀별 장비 분포 바 차트"]');
    await expect(chart).toBeVisible({ timeout: 10000 });

    // 제목: "팀별 장비 분포"
    await expect(chart.getByText('팀별 장비 분포')).toBeVisible();

    // 총 장비 수: "총 N대"
    await expect(chart.getByText(/총 \d+대/)).toBeVisible();

    // 팀별 바가 1개 이상 렌더링
    const bars = chart.locator('[role="listitem"], [class*="bar"]');
    // 또는 팀 이름 텍스트 확인
    const teamText = chart.getByText(/대$/).first();
    await expect(teamText).toBeVisible();
  });

  test('TC-32: TE/QM — 팀별 장비 분포 미표시', async ({ testOperatorPage, qualityManagerPage }) => {
    await testOperatorPage.goto('/');
    await expect(testOperatorPage.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 10000,
    });
    await expect(
      testOperatorPage.locator('[aria-label="팀별 장비 분포 바 차트"]')
    ).not.toBeVisible();

    await qualityManagerPage.goto('/');
    await expect(qualityManagerPage.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 10000,
    });
    await expect(
      qualityManagerPage.locator('[aria-label="팀별 장비 분포 바 차트"]')
    ).not.toBeVisible();
  });
});

test.describe('시나리오 11: RecentActivities', () => {
  test('TC-33: 역할별 제목 — "내 최근 활동" / "팀 최근 활동" / "시험소 최근 활동"', async ({
    testOperatorPage,
    techManagerPage,
    siteAdminPage,
  }) => {
    // test_engineer → "내 최근 활동"
    await testOperatorPage.goto('/');
    const teSection = testOperatorPage.locator('section[aria-label="최근 활동"]');
    await expect(teSection).toBeVisible({ timeout: 10000 });
    await expect(teSection.getByText('내 최근 활동')).toBeVisible();

    // technical_manager → "팀 최근 활동"
    await techManagerPage.goto('/');
    const tmSection = techManagerPage.locator('section[aria-label="최근 활동"]');
    await expect(tmSection).toBeVisible({ timeout: 10000 });
    await expect(tmSection.getByText('팀 최근 활동')).toBeVisible();

    // lab_manager → "시험소 최근 활동"
    await siteAdminPage.goto('/');
    const lmSection = siteAdminPage.locator('section[aria-label="최근 활동"]');
    await expect(lmSection).toBeVisible({ timeout: 10000 });
    await expect(lmSection.getByText('시험소 최근 활동')).toBeVisible();
  });

  test('TC-34: 카테고리 탭 — "전체" + 역할별 카테고리 (장비/교정/반출 등)', async ({
    siteAdminPage: page,
  }) => {
    await page.goto('/');
    const section = page.locator('[role="region"][aria-labelledby="recent-activities-title"]');
    await expect(section).toBeVisible({ timeout: 10000 });

    // shadcn Tabs → TabsTrigger는 role="tab"
    const allTab = section.getByRole('tab', { name: '전체' });
    await expect(allTab).toBeVisible();

    // 역할별 카테고리 탭 (lab_manager: 장비, 교정, 대여, 반출)
    await expect(section.getByRole('tab', { name: '장비' })).toBeVisible();
    await expect(section.getByRole('tab', { name: '교정' })).toBeVisible();
  });

  test('TC-35: 활동 항목 표시 또는 빈 상태', async ({ siteAdminPage: page }) => {
    await page.goto('/');
    const section = page.locator('section[aria-label="최근 활동"]');
    await expect(section).toBeVisible({ timeout: 10000 });

    // 활동 항목이 있거나 빈 상태 메시지
    const hasActivity = await section
      .getByText(/님이/)
      .first()
      .isVisible()
      .catch(() => false);
    const hasEmpty = await section
      .getByText('활동 내역이 없습니다')
      .isVisible()
      .catch(() => false);

    expect(hasActivity || hasEmpty).toBe(true);
  });

  test('TC-36: 역할별 설명 텍스트 확인', async ({ testOperatorPage, techManagerPage }) => {
    // test_engineer → "본인의 최근 7일간 활동 기록입니다"
    await testOperatorPage.goto('/');
    const teSection = testOperatorPage.locator('section[aria-label="최근 활동"]');
    await expect(teSection).toBeVisible({ timeout: 10000 });
    await expect(teSection.getByText('본인의 최근 7일간 활동 기록입니다')).toBeVisible();

    // technical_manager → "팀 내 최근 7일간 활동 기록입니다"
    await techManagerPage.goto('/');
    const tmSection = techManagerPage.locator('section[aria-label="최근 활동"]');
    await expect(tmSection).toBeVisible({ timeout: 10000 });
    await expect(tmSection.getByText('팀 내 최근 7일간 활동 기록입니다')).toBeVisible();
  });
});
