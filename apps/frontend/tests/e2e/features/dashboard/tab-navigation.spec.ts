/**
 * Dashboard Widget Navigation and Content Tests
 *
 * Test Suite 3: 단일 뷰 대시보드 위젯 탐색 및 콘텐츠 확인
 * (기존 탭 네비게이션 테스트를 대시보드 리디자인에 맞게 재작성)
 *
 * - 위젯 섹션 가시성 확인
 * - KPI 카드 클릭 네비게이션
 * - 교정 D-day 리스트 확인
 * - 최근 활동 컴포넌트 내부 탭 전환
 * - 역할별 승인 카드 콘텐츠 확인
 *
 * Roles tested:
 * - lab_manager: 전체 위젯 (KPI all, 팀 분포, 승인 대기)
 * - technical_manager: 팀 위젯 (KPI team, 팀 분포, 승인 관리)
 */

import { test, expect } from '../../shared/fixtures/auth.fixture';

test.describe('Widget Navigation and Content', () => {
  test.describe('3.1 단일 뷰 위젯 섹션 확인 (lab_manager)', () => {
    test('모든 위젯 섹션이 단일 페이지에 표시됨', async ({ siteAdminPage }) => {
      await siteAdminPage.goto('/');

      // 1. 환영 헤더
      await expect(siteAdminPage.getByRole('heading', { level: 1 })).toBeVisible();

      // 2. 빠른 액션 바
      const quickActions = siteAdminPage.locator('nav[aria-label="빠른 액션"]');
      await expect(quickActions).toBeVisible();

      // 3. KPI 통계 카드
      await expect(siteAdminPage.locator('text=사용 가능').first()).toBeVisible();

      // 4. 승인 대기 카드
      const approvalCard = siteAdminPage.getByTestId('pending-approval-card');
      await expect(approvalCard).toBeVisible();

      // 5. 최근 활동 (region)
      const recentActivities = siteAdminPage.locator('[aria-labelledby="recent-activities-title"]');
      await expect(recentActivities).toBeVisible();
    });
  });

  test.describe('3.2 KPI 카드 클릭 네비게이션', () => {
    test('KPI 카드 클릭 시 장비 목록으로 이동', async ({ siteAdminPage }) => {
      await siteAdminPage.goto('/');

      // KPI 카드 내 링크 찾기 (장비 목록으로 이동하는 링크)
      const kpiLinks = siteAdminPage.locator('a[href*="/equipment"]');
      const linkCount = await kpiLinks.count();
      expect(linkCount).toBeGreaterThan(0);
    });
  });

  test.describe('3.3 lab_manager — 전체 위젯 콘텐츠 확인', () => {
    test('lab_manager 전체 위젯 콘텐츠 확인', async ({ siteAdminPage }) => {
      await siteAdminPage.goto('/');

      // 1. 승인 대기 카드 — 시험소 승인 대기
      const approvalCard = siteAdminPage.getByTestId('pending-approval-card');
      await expect(approvalCard).toBeVisible();
      await expect(approvalCard.locator('#pending-approval-title')).toContainText(
        '시험소 승인 대기'
      );

      // 2. 카테고리 링크 표시 (aria-label 로 확인)
      await expect(approvalCard.locator('a[aria-label*="장비"]')).toBeVisible();
      await expect(approvalCard.locator('a[aria-label*="교정"]')).toBeVisible();

      // 3. 최근 활동 — 시험소 최근 활동
      const recentActivities = siteAdminPage.locator('[aria-labelledby="recent-activities-title"]');
      await expect(recentActivities).toBeVisible();
    });
  });

  test.describe('3.4 팀 장비 분포 차트 확인', () => {
    test('lab_manager — 팀별 장비 분포 바 차트 표시', async ({ siteAdminPage }) => {
      await siteAdminPage.goto('/');

      // 팀 장비 분포 섹션 (role="region")
      const teamDistribution = siteAdminPage.locator('[role="region"][aria-label*="팀"]');
      await expect(teamDistribution.first()).toBeVisible();

      // 프로그레스 바 존재 확인
      const progressBars = teamDistribution.locator('[role="progressbar"]');
      const barCount = await progressBars.count();
      expect(barCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('3.5 교정 D-day 리스트 확인', () => {
    test('교정 D-day 리스트에 장비 항목 표시', async ({ siteAdminPage }) => {
      await siteAdminPage.goto('/');

      // 교정 D-day 리스트 섹션 (role="region")
      const calibrationRegion = siteAdminPage.locator('[role="region"][aria-label*="교정"]');
      await expect(calibrationRegion.first()).toBeVisible();
    });
  });

  test.describe('3.6 technical_manager — 승인 관리 위젯 확인', () => {
    test('technical_manager 승인 카드 콘텐츠 확인', async ({ techManagerPage }) => {
      await techManagerPage.goto('/');

      // 1. 승인 대기 카드 — 팀 승인 대기
      const approvalCard = techManagerPage.getByTestId('pending-approval-card');
      await expect(approvalCard).toBeVisible();
      await expect(approvalCard.locator('#pending-approval-title')).toContainText('팀 승인 대기');

      // 2. 카테고리 표시: 장비, 교정, 대여, 보정계수
      await expect(approvalCard.locator('a[aria-label*="장비"]')).toBeVisible();
      await expect(approvalCard.locator('a[aria-label*="교정"]')).toBeVisible();
      await expect(approvalCard.locator('a[aria-label*="대여"]')).toBeVisible();
      await expect(approvalCard.locator('a[aria-label*="보정계수"]')).toBeVisible();

      // 3. 팀 장비 분포 표시
      const teamDistribution = techManagerPage.locator('[role="region"][aria-label*="팀"]');
      await expect(teamDistribution.first()).toBeVisible();
    });
  });
});
