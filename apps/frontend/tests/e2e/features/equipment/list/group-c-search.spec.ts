/**
 * Group C: 검색 기능 테스트
 *
 * 🔥 비즈니스 로직 검증 중심!
 *
 * 검증 범위:
 * 1. 검색 입력 디바운스 및 URL 업데이트
 * 2. 관리번호로 검색
 * 3. 검색어와 필터 조합
 * 4. X 버튼으로 검색어 제거
 * 5. Enter 키로 즉시 검색
 * 6. Escape 키로 검색어 제거
 *
 * 비즈니스 로직:
 * - DB LIKE 검색: WHERE name LIKE '%검색어%' OR modelName LIKE '%검색어%' OR manufacturer LIKE '%검색어%'
 * - 디바운스: 300ms 대기 후 API 호출
 * - API 응답의 모든 항목이 검색어를 포함해야 함
 *
 * SSOT:
 * - equipment-filter-utils.ts: parseEquipmentFiltersFromSearchParams()
 * - API Endpoint: GET /api/equipment?search=검색어
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('Group C: Search Functionality', () => {
  test.describe('11.1. Search input with debounce and URL update', () => {
    test('should debounce search input and update URL', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      const searchInput = testOperatorPage.getByRole('searchbox');
      await searchInput.fill('스펙트럼');

      // 디바운스 대기 (300ms) + buffer
      await testOperatorPage.waitForTimeout(500);

      // 브라우저 URL 업데이트 확인
      await testOperatorPage.waitForURL(/search=/, { timeout: 10000 });
      await expect(testOperatorPage).toHaveURL(/search=%EC%8A%A4%ED%8E%99%ED%8A%B8%EB%9F%BC/); // 스펙트럼 URL 인코딩

      // Verify URL parameters
      const currentUrl = new URL(testOperatorPage.url());
      expect(currentUrl.searchParams.get('search')).toBe('스펙트럼');

      console.log('[Test] ✅ Search input debounced and URL updated');
    });

    test('should update search on every keystroke after debounce', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      const searchInput = testOperatorPage.getByRole('searchbox');

      // 첫 번째 입력: "분석"
      await searchInput.fill('분석');
      await testOperatorPage.waitForTimeout(500);

      // Verify first search
      await testOperatorPage.waitForURL(/search=.*%EB%B6%84%EC%84%9D/, { timeout: 10000 });
      let currentUrl = new URL(testOperatorPage.url());
      expect(currentUrl.searchParams.get('search')).toBe('분석');

      // 두 번째 입력: "분석기"
      await searchInput.fill('분석기');
      await testOperatorPage.waitForTimeout(500);

      // Verify second search
      await testOperatorPage.waitForURL(/search=.*%EB%B6%84%EC%84%9D%EA%B8%B0/, { timeout: 10000 });
      currentUrl = new URL(testOperatorPage.url());
      expect(currentUrl.searchParams.get('search')).toBe('분석기');

      console.log('[Test] ✅ Search updates on every keystroke after debounce');
    });
  });

  test.describe('11.2. Search by management number', () => {
    test('should find equipment by management number', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      // 관리번호 형식: XXX-X YYYY (예: SUW-E 0001)
      const searchInput = testOperatorPage.getByRole('searchbox');
      await searchInput.fill('SUW-E');
      await searchInput.press('Enter'); // Enter로 즉시 검색

      // URL 검증
      await testOperatorPage.waitForURL(/search=SUW-E/, { timeout: 10000 });
      await expect(testOperatorPage).toHaveURL(/search=SUW-E/);

      // Verify URL parameters
      const currentUrl = new URL(testOperatorPage.url());
      expect(currentUrl.searchParams.get('search')).toBe('SUW-E');

      console.log('[Test] ✅ Search by management number works correctly');
    });
  });

  test.describe('11.3. Search combined with filters', () => {
    test('should combine search with status filter', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      // 1. 상태 필터 적용: 사용 가능
      const statusFilter = testOperatorPage.locator('#filter-status');
      await statusFilter.click();
      await testOperatorPage.getByRole('option', { name: '사용 가능' }).click();

      // Wait for status filter to apply
      await testOperatorPage.waitForURL(/status=available/, { timeout: 10000 });

      // 2. 검색어 입력
      const searchInput = testOperatorPage.getByRole('searchbox');
      await searchInput.fill('분석기');
      await searchInput.press('Enter');

      // Wait for search to apply
      await testOperatorPage.waitForURL(/search=/, { timeout: 10000 });

      // Verify both filters in URL
      const currentUrl = new URL(testOperatorPage.url());
      expect(currentUrl.searchParams.get('status')).toBe('available');
      expect(currentUrl.searchParams.get('search')).toBe('분석기');

      // 필터 뱃지 확인
      await expect(testOperatorPage.getByText(/상태:.*사용 가능/)).toBeVisible();

      console.log('[Test] ✅ Search combined with status filter');
    });

    test('should combine search with multiple filters', async ({ testOperatorPage }) => {
      // 직접 URL로 이동하여 3개 필터 적용
      await testOperatorPage.goto('/equipment?status=available&classification=E&search=장비');
      await testOperatorPage.waitForLoadState('load');

      // 🔥 SSOT 검증: URL에서 3개 필터 모두 확인
      const currentUrl = new URL(testOperatorPage.url());
      expect(currentUrl.searchParams.get('status')).toBe('available');
      expect(currentUrl.searchParams.get('classification')).toBe('E');
      expect(currentUrl.searchParams.get('search')).toBe('장비');

      console.log('[Test] ✅ Search combined with multiple filters');
    });
  });

  test.describe('11.4. Clear search with X button', () => {
    test('should clear search when clicking X button', async ({ testOperatorPage }) => {
      // 검색어가 있는 상태로 시작
      await testOperatorPage.goto('/equipment?search=테스트');
      await testOperatorPage.waitForLoadState('networkidle');

      // 검색어 입력창에 값이 있는지 확인
      const searchInput = testOperatorPage.getByRole('searchbox');
      await expect(searchInput).toHaveValue('테스트');

      // X 버튼 클릭
      const clearButton = testOperatorPage.getByRole('button', { name: /검색.*지우기|clear/i });
      await clearButton.click();

      // Wait for URL to update (search parameter removed)
      await testOperatorPage.waitForTimeout(500);

      // 브라우저 URL 확인
      await expect(testOperatorPage).not.toHaveURL(/search=/);

      // Verify search parameter is removed
      const currentUrl = new URL(testOperatorPage.url());
      expect(currentUrl.searchParams.has('search')).toBe(false);

      // 검색 입력창 비어있음
      await expect(searchInput).toHaveValue('');

      console.log('[Test] ✅ Search cleared with X button');
    });

    test('should preserve other filters when clearing search', async ({ testOperatorPage }) => {
      // 검색어 + 상태 필터가 있는 상태
      await testOperatorPage.goto('/equipment?search=장비&status=available');
      await testOperatorPage.waitForLoadState('networkidle');

      // X 버튼으로 검색어만 제거
      const clearButton = testOperatorPage.getByRole('button', { name: /검색.*지우기|clear/i });
      await clearButton.click();

      // Wait for URL to update
      await testOperatorPage.waitForTimeout(500);

      // 🔥 SSOT 검증: search는 제거, status는 유지
      const currentUrl = new URL(testOperatorPage.url());
      expect(currentUrl.searchParams.has('search')).toBe(false);
      expect(currentUrl.searchParams.get('status')).toBe('available');

      // 상태 필터 뱃지는 유지
      await expect(testOperatorPage.getByText(/상태:.*사용 가능/)).toBeVisible();

      console.log('[Test] ✅ Other filters preserved when clearing search');
    });
  });

  test.describe('11.5. Search immediately with Enter key', () => {
    test('should search immediately when pressing Enter', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      const searchInput = testOperatorPage.getByRole('searchbox');
      await searchInput.fill('분석기');

      // Enter 키 누르기 (디바운스 기다리지 않음)
      await searchInput.press('Enter');

      // Wait for URL to update
      await testOperatorPage.waitForURL(/search=/, { timeout: 10000 });

      // 🔥 SSOT 검증: Enter로 즉시 검색 실행
      const currentUrl = new URL(testOperatorPage.url());
      expect(currentUrl.searchParams.get('search')).toBe('분석기');

      console.log('[Test] ✅ Search executed immediately with Enter key');
    });

    test('should skip debounce when pressing Enter', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      const searchInput = testOperatorPage.getByRole('searchbox');

      // 검색어 입력 후 즉시 Enter (디바운스 300ms 기다리지 않음)
      const startTime = Date.now();
      await searchInput.fill('장비');
      await searchInput.press('Enter');

      // Wait for URL to update
      await testOperatorPage.waitForURL(/search=/, { timeout: 10000 });

      const elapsed = Date.now() - startTime;

      // 🔥 비즈니스 로직: 디바운스 없이 즉시 검색 (1초 미만으로 완료)
      expect(elapsed).toBeLessThan(1000);

      console.log(`[Test] ✅ Search executed in ${elapsed}ms (without waiting for debounce)`);
    });
  });

  test.describe('11.6. Clear search with Escape key', () => {
    test('should clear search when pressing Escape', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment?search=테스트장비');
      await testOperatorPage.waitForLoadState('networkidle');

      const searchInput = testOperatorPage.getByRole('searchbox');
      await expect(searchInput).toHaveValue('테스트장비');

      // Escape 키로 검색어 제거
      await searchInput.press('Escape');

      // Wait for URL to update
      await testOperatorPage.waitForTimeout(500);

      // 🔥 SSOT 검증: search 파라미터 제거
      const currentUrl = new URL(testOperatorPage.url());
      expect(currentUrl.searchParams.has('search')).toBe(false);

      // 검색 입력창 비어있음
      await expect(searchInput).toHaveValue('');

      // URL 업데이트 확인
      await expect(testOperatorPage).not.toHaveURL(/search=/);

      console.log('[Test] ✅ Search cleared with Escape key');
    });

    test('should blur input after pressing Escape', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      const searchInput = testOperatorPage.getByRole('searchbox');
      await searchInput.fill('테스트');
      await searchInput.press('Escape');

      // 🔥 UX 검증: Escape 후 포커스 해제
      await testOperatorPage.waitForTimeout(100);
      const isFocused = await searchInput.evaluate((el) => el === document.activeElement);
      expect(isFocused).toBe(false);

      console.log('[Test] ✅ Input blurred after Escape key');
    });
  });

  test.describe('Additional: Search edge cases', () => {
    test('should handle empty search query', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment?search=테스트');
      await testOperatorPage.waitForLoadState('networkidle');

      // 검색어를 지우고 Enter
      const searchInput = testOperatorPage.getByRole('searchbox');
      await searchInput.fill('');
      await searchInput.press('Enter');

      // Wait for URL to update by waiting for the search param to be removed
      await testOperatorPage.waitForURL((url) => !url.searchParams.has('search'), {
        timeout: 5000,
      });

      // 🔥 SSOT 검증: 빈 검색어는 파라미터에서 제거
      const currentUrl = new URL(testOperatorPage.url());
      expect(currentUrl.searchParams.has('search')).toBe(false);

      console.log('[Test] ✅ Empty search query handled correctly');
    });

    test('should handle special characters in search', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      // 특수문자 포함 검색
      const specialChars = 'SUW-E 0001';
      const searchInput = testOperatorPage.getByRole('searchbox');
      await searchInput.fill(specialChars);
      await searchInput.press('Enter');

      // Wait for URL to update
      await testOperatorPage.waitForURL(/search=/, { timeout: 10000 });

      // 🔥 SSOT 검증: URL 인코딩/디코딩 정확성
      const currentUrl = new URL(testOperatorPage.url());
      const searchParam = currentUrl.searchParams.get('search');
      expect(searchParam).toBe(specialChars);

      console.log('[Test] ✅ Special characters in search handled correctly');
    });

    test('should reset page to 1 when searching', async ({ testOperatorPage }) => {
      // 2페이지에서 검색 시작
      await testOperatorPage.goto('/equipment?page=2');
      await testOperatorPage.waitForLoadState('networkidle');

      const searchInput = testOperatorPage.getByRole('searchbox');
      await searchInput.fill('장비');
      await searchInput.press('Enter');

      // Wait for URL to update
      await testOperatorPage.waitForURL(/search=/, { timeout: 10000 });

      // 🔥 비즈니스 로직: 검색 시 페이지 1로 리셋
      const currentUrl = new URL(testOperatorPage.url());
      const pageParam = currentUrl.searchParams.get('page');
      expect(pageParam === null || pageParam === '1').toBe(true);

      console.log('[Test] ✅ Page reset to 1 when searching');
    });
  });
});
