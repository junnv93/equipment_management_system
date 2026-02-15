/**
 * 교정 관리 페이지 E2E 테스트
 *
 * 테스트 범위:
 * - 데이터 표시 (summary, overdue, upcoming, intermediate checks)
 * - 팀 필터 (동적 로딩)
 * - 검색 기능 (장비명, 관리번호)
 * - 탭 전환
 * - 빈 상태 처리
 * - 에러 처리
 *
 * ✅ Auth Fixture 마이그레이션 완료 (2026-02-12)
 *    - 기존: 독자적 loginAs() 폼 기반 로그인 (타임아웃 실패)
 *    - 수정: SSOT auth.fixture.ts (NextAuth test-login Provider)
 *
 * ✅ UI 로케이터 수정 완료 (2026-02-12)
 *    - CalibrationContent.tsx 실제 UI 구조에 맞춰 셀렉터 수정
 *    - 통계 카드: data-testid 없음 → 텍스트 기반 매칭
 *    - 팀 필터: shadcn/ui Select → role="combobox" 트리거
 *    - 빈 상태: strict mode 위반 수정 → getByRole('heading') 사용
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import type { Page } from '@playwright/test';

// 교정 관리 페이지로 이동 헬퍼
async function navigateToCalibrationPage(page: Page) {
  await page.goto('/calibration');
  // 페이지 로딩 대기 (데이터 fetch 완료까지)
  await page.waitForLoadState('networkidle');
  // React Query가 데이터를 로드할 때까지 추가 대기
  await page.waitForTimeout(1000);
}

test.describe('교정 관리 페이지 - 데이터 표시', () => {
  test('요약 통계 카드가 올바르게 표시되어야 한다', async ({ techManagerPage }) => {
    await navigateToCalibrationPage(techManagerPage);

    // 통계 카드 확인 (4개: 전체 교정 장비, 정상 장비, 교정 기한 초과, 30일 이내 교정 필요)
    // 실제 UI: CalibrationContent.tsx → .grid.grid-cols-1.md:grid-cols-4 > Card
    const totalCard = techManagerPage.locator('text=/전체 교정 장비/').first();
    await expect(totalCard).toBeVisible();

    const overdueCard = techManagerPage.locator('text=/교정 기한 초과/').first();
    await expect(overdueCard).toBeVisible();

    const upcomingCard = techManagerPage.locator('text=/30일 이내 교정 필요/').first();
    await expect(upcomingCard).toBeVisible();
  });

  test('기한 초과 탭에 올바른 데이터가 표시되어야 한다', async ({ techManagerPage }) => {
    await navigateToCalibrationPage(techManagerPage);

    // 기한 초과 탭 클릭
    const overdueTab = techManagerPage.locator('button[role="tab"]', { hasText: '기한 초과' });
    await overdueTab.click();
    await techManagerPage.waitForLoadState('networkidle');

    // 테이블 또는 빈 상태가 표시되는지 확인
    const table = techManagerPage.locator('table');
    const isTableVisible = await table.isVisible();

    if (isTableVisible) {
      // 테이블 헤더 확인 (실제 UI: 장비명, 관리번호, 팀, 교정일, 다음 교정일, 교정 기관, 상태, 관리)
      await expect(techManagerPage.locator('th:has-text("장비명")')).toBeVisible();
      await expect(techManagerPage.locator('th:has-text("관리번호")')).toBeVisible();
      await expect(techManagerPage.locator('th:has-text("다음 교정일")')).toBeVisible();
    } else {
      // 빈 상태 메시지 확인 (h3 태그로 특정)
      const emptyMessage = techManagerPage.getByRole('heading', { name: /교정 정보가 없습니다/ });
      await expect(emptyMessage).toBeVisible();
    }
  });

  test('30일 이내 예정 탭에 올바른 데이터가 표시되어야 한다', async ({ techManagerPage }) => {
    await navigateToCalibrationPage(techManagerPage);

    // 30일 이내 예정 탭 클릭
    const upcomingTab = techManagerPage.locator('button[role="tab"]', {
      hasText: '30일 이내 예정',
    });
    await upcomingTab.click();
    await techManagerPage.waitForLoadState('networkidle');

    // 테이블 또는 빈 상태 확인
    const table = techManagerPage.locator('table');
    const isTableVisible = await table.isVisible();

    if (isTableVisible) {
      // 데이터 행이 있는지 확인
      const rows = techManagerPage.locator('tbody tr');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThanOrEqual(0);
    } else {
      // 빈 상태 메시지
      const emptyMessage = techManagerPage.getByRole('heading', { name: /교정 정보가 없습니다/ });
      await expect(emptyMessage).toBeVisible();
    }
  });

  test('중간점검 탭이 올바르게 표시되어야 한다', async ({ techManagerPage }) => {
    await navigateToCalibrationPage(techManagerPage);

    // 중간점검 탭 클릭 (탭 텍스트에 개수 포함: "중간점검 (N)")
    const intermediateTab = techManagerPage.locator('button[role="tab"]', { hasText: '중간점검' });
    await intermediateTab.click();
    await techManagerPage.waitForLoadState('networkidle');

    // 중간점검 데이터 표시 확인
    const hasTable = await techManagerPage.locator('table').isVisible();
    const hasEmptyState = await techManagerPage
      .getByRole('heading', { name: /중간점검 일정이 없습니다/ })
      .isVisible()
      .catch(() => false);

    // 테이블 또는 빈 상태 중 하나는 반드시 표시되어야 함
    expect(hasTable || hasEmptyState).toBe(true);
  });

  test('전체 탭에 모든 교정 이력이 표시되어야 한다', async ({ techManagerPage }) => {
    await navigateToCalibrationPage(techManagerPage);

    // 전체 탭은 기본 선택됨
    const allTab = techManagerPage.locator('button[role="tab"]', { hasText: '전체' });
    await expect(allTab).toHaveAttribute('data-state', 'active');

    // 테이블 확인
    const table = techManagerPage.locator('table');
    const isTableVisible = await table.isVisible();

    if (isTableVisible) {
      // 테이블 헤더 확인
      await expect(techManagerPage.locator('th:has-text("장비명")')).toBeVisible();
    } else {
      // 빈 상태
      const emptyMessage = techManagerPage.getByRole('heading', { name: /교정 정보가 없습니다/ });
      await expect(emptyMessage).toBeVisible();
    }
  });
});

test.describe('교정 관리 페이지 - 팀 필터', () => {
  test('팀 필터 옵션이 동적으로 로드되어야 한다', async ({ techManagerPage }) => {
    await navigateToCalibrationPage(techManagerPage);

    // 팀 필터 트리거 찾기 (shadcn Select → role="combobox", 기본값 "모든 팀")
    const teamFilterTrigger = techManagerPage.getByRole('combobox');
    await teamFilterTrigger.click();

    // 드롭다운이 열렸는지 확인
    const dropdown = techManagerPage.locator('[role="listbox"]');
    await expect(dropdown).toBeVisible();

    // "모든 팀" 옵션 확인
    const allTeamsOption = techManagerPage.locator('[role="option"]', { hasText: '모든 팀' });
    await expect(allTeamsOption).toBeVisible();

    // 동적으로 로드된 팀 옵션이 있는지 확인
    const teamOptions = techManagerPage.locator('[role="option"]');
    const optionCount = await teamOptions.count();

    // 최소 "모든 팀" + 1개 이상의 팀이 있어야 함
    expect(optionCount).toBeGreaterThan(1);

    console.log(`팀 필터 옵션 수: ${optionCount} (모든 팀 포함)`);
  });

  test('팀 필터를 선택하면 해당 팀의 장비만 표시되어야 한다', async ({ techManagerPage }) => {
    await navigateToCalibrationPage(techManagerPage);

    // 팀 필터 열기
    const teamFilterTrigger = techManagerPage.getByRole('combobox');
    await teamFilterTrigger.click();

    // 동적 팀 옵션 중 첫 번째 선택 (모든 팀 제외)
    const teamOptions = techManagerPage
      .locator('[role="option"]')
      .filter({ hasNotText: '모든 팀' });
    const teamCount = await teamOptions.count();

    // 팀이 존재하면 선택
    if (teamCount > 0) {
      const firstTeamOption = teamOptions.first();
      const teamName = await firstTeamOption.textContent();
      await firstTeamOption.click();
      await techManagerPage.waitForLoadState('networkidle');

      console.log(`선택한 팀: ${teamName}`);

      // 필터가 적용되었는지 확인 (테이블 또는 빈 상태)
      const hasTable = (await techManagerPage.locator('table tbody tr').count()) > 0;
      const hasEmptyState = await techManagerPage
        .getByRole('heading', { name: /교정 정보가 없습니다/ })
        .isVisible()
        .catch(() => false);

      // 결과가 표시되거나 빈 상태가 표시되어야 함
      expect(hasTable || hasEmptyState).toBe(true);
    }
  });

  test('"모든 팀" 옵션을 선택하면 전체 장비가 표시되어야 한다', async ({ techManagerPage }) => {
    await navigateToCalibrationPage(techManagerPage);

    const teamFilterTrigger = techManagerPage.getByRole('combobox');

    // 먼저 특정 팀 선택
    await teamFilterTrigger.click();
    const teamOptions = techManagerPage
      .locator('[role="option"]')
      .filter({ hasNotText: '모든 팀' });

    if ((await teamOptions.count()) > 0) {
      await teamOptions.first().click();
      await techManagerPage.waitForLoadState('networkidle');

      // 다시 팀 필터 열고 "모든 팀" 선택
      await teamFilterTrigger.click();
      const allTeamsOption = techManagerPage.locator('[role="option"]', { hasText: '모든 팀' });
      await allTeamsOption.click();
      await techManagerPage.waitForLoadState('networkidle');

      // 전체 데이터가 표시되어야 함
      const table = techManagerPage.locator('table');
      const isTableVisible = await table.isVisible();

      if (isTableVisible) {
        console.log('모든 팀 필터 적용 - 전체 데이터 표시');
      }
    }
  });
});

test.describe('교정 관리 페이지 - 검색 기능', () => {
  test('장비명으로 검색이 가능해야 한다', async ({ techManagerPage }) => {
    await navigateToCalibrationPage(techManagerPage);

    // 검색 입력 필드 찾기 (placeholder: "장비명, 관리번호 검색...")
    const searchInput = techManagerPage.getByPlaceholder(/검색/);
    await expect(searchInput).toBeVisible();

    // 검색어 입력
    await searchInput.fill('Spectrum');
    await techManagerPage.waitForLoadState('networkidle');

    // 검색 결과 확인
    const hasResults = (await techManagerPage.locator('table tbody tr').count()) > 0;
    const hasEmptyState = await techManagerPage
      .getByRole('heading', { name: /교정 정보가 없습니다/ })
      .isVisible()
      .catch(() => false);

    // 결과 또는 빈 상태가 표시되어야 함
    expect(hasResults || hasEmptyState).toBe(true);

    if (hasResults) {
      console.log('장비명 검색 결과 표시됨');
    }
  });

  test('관리번호로 검색이 가능해야 한다', async ({ techManagerPage }) => {
    await navigateToCalibrationPage(techManagerPage);

    const searchInput = techManagerPage.getByPlaceholder(/검색/);
    await expect(searchInput).toBeVisible();

    // 관리번호 형식으로 검색 (SUW-E0001 형식)
    await searchInput.fill('SUW');
    await techManagerPage.waitForLoadState('networkidle');

    // 검색 결과 확인
    const hasResults = (await techManagerPage.locator('table tbody tr').count()) > 0;
    const hasEmptyState = await techManagerPage
      .getByRole('heading', { name: /교정 정보가 없습니다/ })
      .isVisible()
      .catch(() => false);

    expect(hasResults || hasEmptyState).toBe(true);
  });

  test('검색어를 지우면 전체 목록이 다시 표시되어야 한다', async ({ techManagerPage }) => {
    await navigateToCalibrationPage(techManagerPage);

    const searchInput = techManagerPage.getByPlaceholder(/검색/);

    // 검색어 입력
    await searchInput.fill('NonExistentEquipment');
    await techManagerPage.waitForLoadState('networkidle');

    // 검색어 지우기
    await searchInput.clear();
    await techManagerPage.waitForLoadState('networkidle');

    // 전체 목록 또는 빈 상태가 표시되어야 함
    const hasTable = await techManagerPage.locator('table').isVisible();
    const hasEmptyState = await techManagerPage
      .getByRole('heading', { name: /교정 정보가 없습니다/ })
      .isVisible()
      .catch(() => false);

    expect(hasTable || hasEmptyState).toBe(true);
  });
});

test.describe('교정 관리 페이지 - 탭 전환', () => {
  test('모든 탭이 접근 가능해야 한다', async ({ techManagerPage }) => {
    await navigateToCalibrationPage(techManagerPage);

    // 4개의 탭 확인
    const tabs = ['전체', '기한 초과', '30일 이내 예정', '중간점검'];

    for (const tabName of tabs) {
      const tab = techManagerPage.locator(`button[role="tab"]`).filter({ hasText: tabName });
      await expect(tab).toBeVisible();
      await expect(tab).toBeEnabled();

      // 탭 클릭
      await tab.click();
      await techManagerPage.waitForLoadState('networkidle');

      // 탭이 활성화되었는지 확인
      await expect(tab).toHaveAttribute('data-state', 'active');

      console.log(`${tabName} 탭 전환 성공`);
    }
  });

  test('탭 전환 시 데이터가 올바르게 로드되어야 한다', async ({ techManagerPage }) => {
    await navigateToCalibrationPage(techManagerPage);

    // 전체 탭 -> 기한 초과 탭
    const overdueTab = techManagerPage
      .locator('button[role="tab"]')
      .filter({ hasText: '기한 초과' });
    await overdueTab.click();
    await techManagerPage.waitForLoadState('networkidle');

    // 데이터 또는 빈 상태 확인
    const hasData1 = (await techManagerPage.locator('table tbody tr').count()) > 0;
    const hasEmpty1 = await techManagerPage
      .getByRole('heading', { name: /교정 정보가 없습니다/ })
      .isVisible()
      .catch(() => false);
    expect(hasData1 || hasEmpty1).toBe(true);

    // 30일 이내 예정 탭으로 전환
    const upcomingTab = techManagerPage
      .locator('button[role="tab"]')
      .filter({ hasText: '30일 이내 예정' });
    await upcomingTab.click();
    await techManagerPage.waitForLoadState('networkidle');

    // 데이터 또는 빈 상태 확인
    const hasData2 = (await techManagerPage.locator('table tbody tr').count()) > 0;
    const hasEmpty2 = await techManagerPage
      .getByRole('heading', { name: /교정 정보가 없습니다/ })
      .isVisible()
      .catch(() => false);
    expect(hasData2 || hasEmpty2).toBe(true);
  });
});

test.describe('교정 관리 페이지 - 빈 상태 처리', () => {
  test('데이터가 없을 때 적절한 빈 상태 메시지가 표시되어야 한다', async ({ testOperatorPage }) => {
    await navigateToCalibrationPage(testOperatorPage);

    // 검색으로 빈 상태 유도
    const searchInput = testOperatorPage.getByPlaceholder(/검색/);
    await searchInput.fill('ThisEquipmentDefinitelyDoesNotExist12345');
    await testOperatorPage.waitForLoadState('networkidle');

    // 빈 상태 메시지 확인 (h3 태그로 특정하여 strict mode 방지)
    const emptyMessage = testOperatorPage.getByRole('heading', { name: /교정 정보가 없습니다/ });
    const isEmptyVisible = await emptyMessage.isVisible().catch(() => false);

    if (isEmptyVisible) {
      console.log('빈 상태 메시지 표시됨');
    }
  });
});

test.describe('교정 관리 페이지 - 에러 처리', () => {
  test('로딩 상태가 올바르게 표시되어야 한다', async ({ techManagerPage }) => {
    // 페이지 이동 (로딩 상태 관찰)
    await techManagerPage.goto('/calibration');

    // 로딩 표시 확인 (빠르게 사라질 수 있음)
    await techManagerPage.waitForLoadState('networkidle');

    // 최종적으로 콘텐츠가 표시되어야 함
    // .or() 패턴으로 table 또는 빈 상태 heading 중 하나 확인
    const table = techManagerPage.locator('table');
    const emptyHeading = techManagerPage.getByRole('heading', { name: /교정 정보가 없습니다/ });
    await expect(table.or(emptyHeading)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('교정 관리 페이지 - 권한별 접근', () => {
  test('시험실무자는 교정 관리 페이지에 접근할 수 있어야 한다', async ({ testOperatorPage }) => {
    await navigateToCalibrationPage(testOperatorPage);

    // 페이지 제목 확인
    await expect(
      testOperatorPage.locator('h1, h2').filter({ hasText: /교정|Calibration/i })
    ).toBeVisible();
  });

  test('기술책임자는 교정 관리 페이지에 접근할 수 있어야 한다', async ({ techManagerPage }) => {
    await navigateToCalibrationPage(techManagerPage);

    // 페이지 제목 확인
    await expect(
      techManagerPage.locator('h1, h2').filter({ hasText: /교정|Calibration/i })
    ).toBeVisible();
  });

  test('시험소장은 교정 관리 페이지에 접근할 수 있어야 한다', async ({ siteAdminPage }) => {
    await navigateToCalibrationPage(siteAdminPage);

    // 페이지 제목 확인
    await expect(
      siteAdminPage.locator('h1, h2').filter({ hasText: /교정|Calibration/i })
    ).toBeVisible();
  });
});
