/**
 * Dashboard Team Filtering E2E Tests (URL Parameter Based)
 *
 * 리디자인(99a7c59b) 이후 대시보드 팀 필터링은 URL ?teamId= 파라미터 기반.
 * - 탭 UI 제거됨 → Command Center 단일 뷰
 * - resolveDashboardScope()가 URL teamId → API scope 결정
 * - KPI 카드 링크에 teamId 자동 포함 (buildScopedEquipmentUrl)
 *
 * 역할별 동작:
 * - test_engineer/technical_manager: requiresTeamScope=true → 자동 팀 스코프
 * - lab_manager/system_admin: requiresTeamScope=false → 전체 조회, ?teamId= 드릴다운
 */

import { test, expect } from '../../shared/fixtures/auth.fixture';

// ─── 헬퍼 ──────────────────────────────────────────────────────

/** 대시보드 aggregate API에서 totalEquipment 추출 */
async function fetchTotalEquipment(
  page: import('@playwright/test').Page,
  teamId?: string
): Promise<number> {
  const url = teamId ? `/api/dashboard/aggregate?teamId=${teamId}` : '/api/dashboard/aggregate';
  const res = await page.request.get(url);
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  return data.summary?.totalEquipment ?? 0;
}

/** 팀 목록 API에서 첫 번째 팀 반환 */
async function fetchFirstTeam(
  page: import('@playwright/test').Page
): Promise<{ id: string; name: string }> {
  const res = await page.request.get('/api/teams');
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  const team = data.data?.[0] ?? data[0];
  expect(team).toBeTruthy();
  return team;
}

// ─── 테스트 ─────────────────────────────────────────────────────

test.describe('Dashboard Team Filtering (URL Param)', () => {
  test('URL ?teamId= 파라미터로 대시보드 데이터가 필터링된다', async ({ siteAdminPage }) => {
    // 1. 팀 정보 + 전체/필터 aggregate를 API 레벨에서 비교
    const team = await fetchFirstTeam(siteAdminPage);
    const allTotal = await fetchTotalEquipment(siteAdminPage);
    const filteredTotal = await fetchTotalEquipment(siteAdminPage, team.id);

    expect(allTotal).toBeGreaterThan(0);
    expect(filteredTotal).toBeLessThanOrEqual(allTotal);

    // 2. UI 검증: ?teamId= 파라미터로 접속 시 KPI에 필터된 수치 반영
    await siteAdminPage.goto(`/?teamId=${team.id}`);

    // KPI Hero 카드 (전체 장비) 확인
    const kpiSection = siteAdminPage
      .locator('section')
      .filter({
        has: siteAdminPage.locator('a[class*="heroCard"], a[href*="/equipment"]'),
      })
      .first();
    await expect(kpiSection).toBeVisible();

    // Hero 카드 내 장비 수가 filteredTotal과 일치
    await expect(kpiSection.getByText(String(filteredTotal))).toBeVisible({ timeout: 10000 });
  });

  test('KPI 카드 링크에 teamId가 포함된다', async ({ siteAdminPage }) => {
    const team = await fetchFirstTeam(siteAdminPage);

    await siteAdminPage.goto(`/?teamId=${team.id}`);

    // KPI 카드 링크들이 teamId 파라미터를 포함하는지 확인
    // KpiStatusGrid의 Link 컴포넌트는 buildScopedEquipmentUrl()로 URL 생성
    const kpiLinks = siteAdminPage.locator('a[href*="/equipment"]');
    await expect(kpiLinks.first()).toBeVisible({ timeout: 10000 });

    const linkCount = await kpiLinks.count();
    expect(linkCount).toBeGreaterThan(0);

    for (let i = 0; i < linkCount; i++) {
      const href = await kpiLinks.nth(i).getAttribute('href');
      expect(href).toContain(`teamId=${team.id}`);
    }
  });

  test('teamId 없이 접속하면 전체 사이트 데이터가 표시된다 (lab_manager)', async ({
    siteAdminPage,
  }) => {
    const allTotal = await fetchTotalEquipment(siteAdminPage);

    await siteAdminPage.goto('/');

    // KPI Hero 카드에 전체 장비 수 표시 확인
    await expect(siteAdminPage.getByText(String(allTotal)).first()).toBeVisible({ timeout: 10000 });

    // KPI 링크에 teamId가 없어야 함
    const heroLink = siteAdminPage.locator('a[href*="/equipment"]').first();
    await expect(heroLink).toBeVisible();
    const href = await heroLink.getAttribute('href');
    expect(href).not.toContain('teamId=');
  });

  test('시험실무자는 자동으로 소속 팀 스코프가 적용된다', async ({ testOperatorPage }) => {
    // test_engineer는 requiresTeamScope=true → ?teamId= 없이도 팀 자동 필터링
    await testOperatorPage.goto('/');

    // "내 장비" KPI 레이블 확인 (kpiDisplay: 'my')
    await expect(testOperatorPage.getByText('내 장비').first()).toBeVisible({ timeout: 10000 });

    // KPI 링크에 teamId가 포함되어야 함 (세션 teamId가 자동 적용)
    const equipmentLink = testOperatorPage.locator('a[href*="/equipment"]').first();
    await expect(equipmentLink).toBeVisible();
    const href = await equipmentLink.getAttribute('href');
    expect(href).toContain('teamId=');
  });

  test('팀 장비 분포 위젯: lab_manager는 표시, test_engineer는 미표시', async ({
    siteAdminPage,
    testOperatorPage,
  }) => {
    // lab_manager: showTeamDistribution=true
    await siteAdminPage.goto('/');
    const teamDistribution = siteAdminPage.locator('[role="region"]').filter({
      hasText: /팀별 장비|Team Equipment/,
    });
    await expect(teamDistribution).toBeVisible({ timeout: 10000 });

    // test_engineer: showTeamDistribution=false
    await testOperatorPage.goto('/');
    const teDistribution = testOperatorPage.locator('[role="region"]').filter({
      hasText: /팀별 장비|Team Equipment/,
    });
    await expect(teDistribution).toBeHidden();
  });
});
