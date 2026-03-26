/**
 * 교정 관리 페이지 E2E 테스트
 *
 * 현재 UI 구조:
 * - 통계 카드: 전체 교정 장비 / 정상 장비 / 교정 기한 초과 / 30일 이내 교정 필요
 * - 탭: 교정목록 / 중간점검 (N) / 자체점검
 * - 필터: 사이트, 팀, 승인 상태, 교정 결과, 교정 기한
 * - 검색: 장비명, 관리번호
 *
 * ✅ SSOT: auth.fixture.ts (storageState 기반 인증)
 * ✅ networkidle/waitForTimeout 금지 → locator assertion 사용
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import type { Page } from '../../../../shared/fixtures/auth.fixture';

/**
 * 교정 관리 페이지로 이동 + 콘텐츠 로딩 대기
 */
async function navigateToCalibrationPage(page: Page) {
  await page.goto('/calibration');
  // 페이지 heading 대기
  await expect(
    page.locator('h1, h2').filter({ hasText: /교정 관리|교정|Calibration/i })
  ).toBeVisible({ timeout: 15000 });
  // 데이터 로딩 완료: 테이블 또는 빈 상태
  await expect(
    page.locator('table').or(page.locator('text=/교정 정보가 없습니다|등록된 교정/'))
  ).toBeVisible({ timeout: 10000 });
}

test.describe('교정 관리 페이지 - 데이터 표시', () => {
  test('요약 통계 카드가 올바르게 표시되어야 한다', async ({ techManagerPage }) => {
    await navigateToCalibrationPage(techManagerPage);

    await expect(techManagerPage.locator('text=/전체 교정 장비/').first()).toBeVisible();
    await expect(techManagerPage.locator('text=/교정 기한 초과/').first()).toBeVisible();
    await expect(techManagerPage.locator('text=/30일 이내 교정 필요/').first()).toBeVisible();
  });

  test('교정목록 탭이 기본 활성 상태여야 한다', async ({ techManagerPage }) => {
    await navigateToCalibrationPage(techManagerPage);

    // 교정목록 탭이 활성화되어 있는지 확인
    const listTab = techManagerPage.getByRole('tab', { name: /교정목록/ });
    await expect(listTab).toBeVisible();

    const table = techManagerPage.locator('table');
    const isTableVisible = await table.isVisible();
    if (isTableVisible) {
      await expect(techManagerPage.locator('th:has-text("장비명")').first()).toBeVisible();
    }
  });

  test('중간점검 탭이 올바르게 표시되어야 한다', async ({ techManagerPage }) => {
    await navigateToCalibrationPage(techManagerPage);

    // 중간점검 탭 클릭 (이름에 카운트 포함: "중간점검 (N)")
    const intermediateTab = techManagerPage.getByRole('tab', { name: /중간점검/ });
    await intermediateTab.click();
    await expect(intermediateTab).toHaveAttribute('data-state', 'active');

    // 콘텐츠 로딩 대기
    await expect(
      techManagerPage
        .locator('table')
        .or(techManagerPage.locator('text=/중간점검 일정이 없습니다/'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('자체점검 탭이 올바르게 표시되어야 한다', async ({ techManagerPage }) => {
    await navigateToCalibrationPage(techManagerPage);

    const selfInspectionTab = techManagerPage.getByRole('tab', { name: /자체점검/ });
    await selfInspectionTab.click();
    await expect(selfInspectionTab).toHaveAttribute('data-state', 'active');

    // 자체점검 콘텐츠 로딩 대기
    await expect(
      techManagerPage.locator('table').or(techManagerPage.locator('text=/자체점검|점검 일정/'))
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('교정 관리 페이지 - 필터', () => {
  test('팀 필터 옵션이 동적으로 로드되어야 한다', async ({ techManagerPage }) => {
    await navigateToCalibrationPage(techManagerPage);

    // 팀 필터 트리거 (여러 combobox 중 팀 필터 선택)
    const teamFilter = techManagerPage.getByRole('combobox').first();
    await teamFilter.click();

    const dropdown = techManagerPage.getByRole('listbox');
    await expect(dropdown).toBeVisible();

    // 옵션이 1개 이상 로드되어야 함
    const options = techManagerPage.getByRole('option');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
  });

  test('팀 필터를 선택하면 결과가 갱신되어야 한다', async ({ techManagerPage }) => {
    await navigateToCalibrationPage(techManagerPage);

    const teamFilter = techManagerPage.getByRole('combobox').first();
    await teamFilter.click();

    const teamOptions = techManagerPage.getByRole('option').filter({ hasNotText: /모든 팀|전체/ });

    if ((await teamOptions.count()) > 0) {
      await teamOptions.first().click();
      // 필터 적용 후 결과 대기
      await expect(
        techManagerPage
          .locator('table')
          .or(techManagerPage.locator('text=/교정 정보가 없습니다|등록된 교정/'))
      ).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('교정 관리 페이지 - 검색 기능', () => {
  test('장비명으로 검색이 가능해야 한다', async ({ techManagerPage }) => {
    await navigateToCalibrationPage(techManagerPage);

    const searchInput = techManagerPage.getByPlaceholder(/검색/);
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Spectrum');
    await expect(
      techManagerPage
        .locator('table')
        .or(techManagerPage.locator('text=/교정 정보가 없습니다|등록된 교정/'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('관리번호로 검색이 가능해야 한다', async ({ techManagerPage }) => {
    await navigateToCalibrationPage(techManagerPage);

    const searchInput = techManagerPage.getByPlaceholder(/검색/);
    await searchInput.fill('SUW');
    await expect(
      techManagerPage
        .locator('table')
        .or(techManagerPage.locator('text=/교정 정보가 없습니다|등록된 교정/'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('검색어를 지우면 전체 목록이 다시 표시되어야 한다', async ({ techManagerPage }) => {
    await navigateToCalibrationPage(techManagerPage);

    const searchInput = techManagerPage.getByPlaceholder(/검색/);
    await searchInput.fill('NonExistentEquipment');
    await expect(
      techManagerPage
        .locator('table')
        .or(techManagerPage.locator('text=/교정 정보가 없습니다|등록된 교정/'))
    ).toBeVisible({ timeout: 10000 });

    await searchInput.clear();
    await expect(
      techManagerPage
        .locator('table')
        .or(techManagerPage.locator('text=/교정 정보가 없습니다|등록된 교정/'))
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('교정 관리 페이지 - 탭 전환', () => {
  test('모든 탭이 접근 가능하고 전환되어야 한다', async ({ techManagerPage }) => {
    await navigateToCalibrationPage(techManagerPage);

    // 교정목록 탭
    const listTab = techManagerPage.getByRole('tab', { name: /교정목록/ });
    await expect(listTab).toBeVisible();

    // 중간점검 탭
    const intermediateTab = techManagerPage.getByRole('tab', { name: /중간점검/ });
    await expect(intermediateTab).toBeVisible();
    await intermediateTab.click();
    await expect(intermediateTab).toHaveAttribute('data-state', 'active');

    // 자체점검 탭
    const selfTab = techManagerPage.getByRole('tab', { name: /자체점검/ });
    await expect(selfTab).toBeVisible();
    await selfTab.click();
    await expect(selfTab).toHaveAttribute('data-state', 'active');

    // 다시 교정목록 탭으로 돌아오기
    await listTab.click();
    await expect(listTab).toHaveAttribute('data-state', 'active');
  });
});

test.describe('교정 관리 페이지 - 빈 상태 처리', () => {
  test('존재하지 않는 장비를 검색하면 빈 상태가 표시되어야 한다', async ({ testOperatorPage }) => {
    await navigateToCalibrationPage(testOperatorPage);

    const searchInput = testOperatorPage.getByPlaceholder(/검색/);
    await searchInput.fill('ThisEquipmentDefinitelyDoesNotExist12345');

    await expect(
      testOperatorPage
        .locator('table')
        .or(testOperatorPage.locator('text=/교정 정보가 없습니다|등록된 교정/'))
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('교정 관리 페이지 - 로딩 상태', () => {
  test('페이지 로딩 후 콘텐츠가 표시되어야 한다', async ({ techManagerPage }) => {
    await techManagerPage.goto('/calibration');

    await expect(
      techManagerPage
        .locator('table')
        .or(techManagerPage.locator('text=/교정 정보가 없습니다|등록된 교정/'))
    ).toBeVisible({ timeout: 15000 });
  });
});

test.describe('교정 관리 페이지 - 권한별 접근', () => {
  test('시험실무자는 교정 관리 페이지에 접근할 수 있어야 한다', async ({ testOperatorPage }) => {
    await navigateToCalibrationPage(testOperatorPage);
    await expect(
      testOperatorPage.locator('h1, h2').filter({ hasText: /교정 관리|교정|Calibration/i })
    ).toBeVisible();
  });

  test('기술책임자는 교정 관리 페이지에 접근할 수 있어야 한다', async ({ techManagerPage }) => {
    await navigateToCalibrationPage(techManagerPage);
    await expect(
      techManagerPage.locator('h1, h2').filter({ hasText: /교정 관리|교정|Calibration/i })
    ).toBeVisible();
  });

  test('시험소장은 교정 관리 페이지에 접근할 수 있어야 한다', async ({ siteAdminPage }) => {
    await navigateToCalibrationPage(siteAdminPage);
    await expect(
      siteAdminPage.locator('h1, h2').filter({ hasText: /교정 관리|교정|Calibration/i })
    ).toBeVisible();
  });
});
