/**
 * Group F: Empty States Tests
 *
 * 빈 상태 UI 테스트 (3개)
 * - 데이터 없음 상태
 * - 검색 결과 없음 상태
 * - 필터 결과 없음 상태
 *
 * Auth: testOperatorPage (시험실무자)
 *
 * Note: Tests marked as fixme due to architecture limitations
 * - SSR fetches real data before mocks can be applied
 * - Would require backend test data setup or API mocking at network level
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('Group F: Empty States', () => {
  /**
   * F-1: 데이터 없음 상태
   * - 등록된 장비가 하나도 없을 때
   * - "등록된 장비가 없습니다" 메시지 표시
   * - "장비 등록" 버튼 표시
   *
   * FIXME: Test requires empty database or proper API mocking for SSR
   * Current architecture: Server Component fetches initial data before client-side mocks apply
   */
  test.fixme(
    'F-1: should display empty state when no equipment exists',
    async ({ testOperatorPage }) => {
      // This test would require:
      // 1. Empty test database, OR
      // 2. Mock at MSW/network level before SSR, OR
      // 3. Backend API test endpoint that returns empty data

      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForTimeout(1000);

      // Verify empty state component
      const emptyStateSection = testOperatorPage
        .locator('div')
        .filter({ hasText: '등록된 장비가 없습니다' })
        .first();
      await expect(emptyStateSection).toBeVisible();

      // Package 아이콘 확인
      const packageIcon = testOperatorPage.locator('svg.lucide-package');
      await expect(packageIcon).toBeVisible();

      // 제목 확인
      const heading = testOperatorPage.getByRole('heading', { name: '등록된 장비가 없습니다' });
      await expect(heading).toBeVisible();

      // 설명 문구 확인
      const description = testOperatorPage.getByText('첫 번째 장비를 등록해보세요.');
      await expect(description).toBeVisible();

      // "장비 등록" 버튼 확인
      const registerButton = testOperatorPage.getByRole('link', { name: '장비 등록' });
      await expect(registerButton).toBeVisible();
      await expect(registerButton).toHaveAttribute('href', '/equipment/create');
    }
  );

  /**
   * F-2: 검색 결과 없음 상태
   * - 검색어로 필터링 시 결과가 없을 때
   * - "검색 결과가 없습니다" 메시지 표시
   * - 검색어 표시
   *
   * FIXME: Page crashes during navigation - needs proper test environment setup
   */
  test.fixme(
    'F-2: should display empty search results when search has no matches',
    async ({ testOperatorPage }) => {
      const searchTerm = '존재하지않는장비이름XYZ999NOTFOUND';

      // Navigate to equipment page first
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForTimeout(1000);

      // Enter search term
      const searchInput = testOperatorPage.getByPlaceholder('장비명, 관리번호, 모델명으로 검색...');
      await searchInput.fill(searchTerm);
      await searchInput.press('Enter');

      // Wait for search results
      await testOperatorPage.waitForTimeout(1000);

      // Verify empty search results component
      const emptySearchSection = testOperatorPage
        .locator('div')
        .filter({ hasText: '검색 결과가 없습니다' })
        .first();
      await expect(emptySearchSection).toBeVisible();

      // SearchX icon
      const searchXIcon = testOperatorPage.locator('svg.lucide-search-x');
      await expect(searchXIcon).toBeVisible();

      // Heading
      const heading = testOperatorPage.getByRole('heading', { name: '검색 결과가 없습니다' });
      await expect(heading).toBeVisible();

      // Description with search term
      const description = testOperatorPage.getByText(
        `"${searchTerm}"에 대한 검색 결과가 없습니다.`
      );
      await expect(description).toBeVisible();
    }
  );

  /**
   * F-3: 필터 결과 없음 상태
   * - 필터 조건으로 필터링 시 결과가 없을 때
   * - "검색 결과가 없습니다" 메시지 표시
   * - "필터 초기화" 버튼 표시
   *
   * FIXME: Page crashes during navigation - needs proper test environment setup
   */
  test.fixme(
    'F-3: should display empty filter results with reset button',
    async ({ testOperatorPage }) => {
      // Navigate to equipment page
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForTimeout(1000);

      // Open filter panel
      const filterTrigger = testOperatorPage.getByRole('button', { name: /필터/ });
      await filterTrigger.click();

      // Select a status filter that likely has no results (e.g., "retired")
      const statusFilter = testOperatorPage
        .locator('button[role="combobox"]')
        .filter({ hasText: '전체 상태' });
      await statusFilter.click();
      await testOperatorPage.waitForTimeout(300);

      const retiredOption = testOperatorPage.getByRole('option', { name: '폐기' });
      await retiredOption.click();

      // Wait for filter to apply
      await testOperatorPage.waitForTimeout(1000);

      // Verify empty filter results component
      const emptyFilterSection = testOperatorPage
        .locator('div')
        .filter({ hasText: '검색 결과가 없습니다' })
        .first();
      await expect(emptyFilterSection).toBeVisible();

      // SearchX icon
      const searchXIcon = testOperatorPage.locator('svg.lucide-search-x');
      await expect(searchXIcon).toBeVisible();

      // Heading
      const heading = testOperatorPage.getByRole('heading', { name: '검색 결과가 없습니다' });
      await expect(heading).toBeVisible();

      // Description
      const description = testOperatorPage.getByText('현재 필터 조건에 맞는 장비가 없습니다.');
      await expect(description).toBeVisible();

      // "필터 초기화" button
      const resetButton = testOperatorPage.getByRole('button', { name: '필터 초기화' });
      await expect(resetButton).toBeVisible();

      // Test reset button
      await resetButton.click();

      // Verify filter is cleared (URL check)
      await testOperatorPage.waitForTimeout(500);
      const url = testOperatorPage.url();
      expect(url).not.toContain('status=');
    }
  );
});
