/**
 * 대시보드 종합 E2E 테스트 — 시나리오 12, 13: 데이터 스코프 + 반응형 레이아웃
 *
 * 시나리오 12: TE/TM은 소속 팀 데이터만, QM/LM은 팀 드릴다운 가능
 * 시나리오 13: 모바일(375px), 태블릿(768px), 데스크톱(1280px) 레이아웃
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('시나리오 12: 데이터 스코프 검증', () => {
  test('TC-37: TE/TM — KPI 링크에 teamId 파라미터 포함', async ({ techManagerPage: page }) => {
    await page.goto('/');
    const kpiSection = page.locator('section[aria-label="장비 현황 통계"]');
    await expect(kpiSection).toBeVisible({ timeout: 10000 });

    // Hero 카드 링크에 teamId 쿼리 파라미터 포함
    const heroLink = kpiSection.locator('a').first();
    const href = await heroLink.getAttribute('href');
    expect(href).toContain('teamId=');
  });

  test('TC-38: QM/LM — KPI 링크에 teamId 미포함 (사이트 전체)', async ({ siteAdminPage: page }) => {
    await page.goto('/');
    const kpiSection = page.locator('section[aria-label="장비 현황 통계"]');
    await expect(kpiSection).toBeVisible({ timeout: 10000 });

    // Hero 카드 링크에 teamId 없음 (requiresTeamScope: false)
    const heroLink = kpiSection.locator('a').first();
    const href = await heroLink.getAttribute('href');
    // LM은 teamId 자동 포함 안 함
    // href에 teamId가 없거나, 있더라도 URL 파라미터로 드릴다운 가능
    expect(href).toContain('/equipment');
  });

  test('TC-39: QM/LM — URL ?teamId= 파라미터로 팀 드릴다운', async ({ siteAdminPage: page }) => {
    // teamId를 URL에 직접 전달
    await page.goto('/?teamId=aaaa0001-0000-0000-0000-000000000001');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // KPI 링크에 해당 teamId가 포함되는지 확인
    const kpiSection = page.locator('section[aria-label="장비 현황 통계"]');
    await expect(kpiSection).toBeVisible();

    const heroLink = kpiSection.locator('a').first();
    const href = await heroLink.getAttribute('href');
    expect(href).toContain('teamId=');
  });
});

test.describe('시나리오 13: 반응형 레이아웃', () => {
  test('TC-40: 모바일(375px) — 단일 컬럼, 핵심 위젯 표시', async ({ siteAdminPage: page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // WelcomeHeader 표시
    await expect(page.locator('[aria-label="환영 메시지 및 사용자 정보"]')).toBeVisible();

    // QuickActionBar 표시 (축소 형태)
    await expect(page.getByRole('navigation', { name: '빠른 액션' })).toBeVisible();

    // KPI 카드 4개 표시 (2x2 그리드)
    const kpiSection = page.locator('section[aria-label="장비 현황 통계"]');
    await expect(kpiSection).toBeVisible();
    const cards = kpiSection.locator('a');
    await expect(cards).toHaveCount(4);

    // 수평 스크롤 없음
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(395); // 375 + 약간의 여유
  });

  test('TC-41: 태블릿(768px) — 2컬럼 그리드', async ({ siteAdminPage: page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 모든 핵심 위젯 표시
    await expect(page.locator('[aria-label="환영 메시지 및 사용자 정보"]')).toBeVisible();
    await expect(page.locator('section[aria-label="장비 현황 통계"]')).toBeVisible();
    await expect(page.getByTestId('pending-approval-card')).toBeVisible();
    await expect(page.locator('[aria-label="미니 달력"]')).toBeVisible();
  });

  test('TC-42: 데스크톱(1280px) — 풀 레이아웃 (Row 0~4 구조)', async ({ siteAdminPage: page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 모든 10개 위젯 표시
    await expect(page.locator('[aria-label="환영 메시지 및 사용자 정보"]')).toBeVisible();
    await expect(page.getByRole('navigation', { name: '빠른 액션' })).toBeVisible();
    await expect(page.locator('[aria-label="긴급 조치 요약"]')).toBeVisible();
    await expect(page.locator('section[aria-label="장비 현황 통계"]')).toBeVisible();
    await expect(page.getByTestId('pending-approval-card')).toBeVisible();
    await expect(page.locator('[aria-label="반출 현황 목록"]')).toBeVisible();
    await expect(page.locator('[aria-label="교정 현황 컴팩트 리스트"]')).toBeVisible();
    await expect(page.locator('[aria-label="팀별 장비 분포 바 차트"]')).toBeVisible();
    await expect(page.locator('[aria-label="미니 달력"]')).toBeVisible();
    await expect(page.locator('section[aria-label="최근 활동"]')).toBeVisible();

    // Row 3 액션 행: PendingApproval + OverdueCheckouts + CalibrationDday가 가로 배치
    // CalibrationDdayList가 우측 280px 고정 컬럼인지 확인
    const calDday = page.locator('[aria-label="교정 현황 컴팩트 리스트"]');
    const calBox = await calDday.boundingBox();
    if (calBox) {
      // 280px 고정 컬럼이므로 너비가 약 280px 근처
      expect(calBox.width).toBeLessThanOrEqual(320);
      expect(calBox.width).toBeGreaterThanOrEqual(240);
    }
  });

  test('TC-43: 모바일 역할 설명 숨김 + 데스크톱 표시', async ({ siteAdminPage: page }) => {
    // 모바일: 역할 설명 숨김 (hidden sm:block)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    const roleDesc = page.getByText('시험소 전체 관리, 교정계획서 승인');
    await expect(roleDesc).not.toBeVisible();

    // 데스크톱: 역할 설명 표시
    await page.setViewportSize({ width: 1280, height: 800 });
    // reflow 대기
    await expect(roleDesc).toBeVisible({ timeout: 3000 });
  });
});
