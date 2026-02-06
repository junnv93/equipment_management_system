/**
 * Group B: 복합 필터 테스트
 *
 * 검증 범위:
 * 1. 여러 필터 동시 적용 시 AND 조건 결합
 * 2. 필터 초기화 기능
 * 3. 개별 필터 제거 시 다른 필터 유지
 * 4. 상태 필터와 교정 기한 필터의 독립성
 *
 * SQL 유사 로직:
 * WHERE site='SUW' AND status='available' AND calibrationMethod='external_calibration'
 *
 * SSOT:
 * - equipment-filter-utils.ts: countActiveFilters()
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('Group B: Combined Filters', () => {
  test.describe('9.1. Multiple filters can be applied simultaneously', () => {
    test('should apply multiple filters with AND logic', async ({ siteAdminPage }) => {
      // lab_manager로 테스트 (모든 사이트 필터 사용 가능)
      await siteAdminPage.goto('/equipment');
      await siteAdminPage.waitForLoadState('networkidle');

      // Wait for client-side hydration to complete
      await siteAdminPage.waitForTimeout(1500);

      // 1. 사이트 필터 적용
      const siteFilter = siteAdminPage.locator('#filter-site');
      await siteFilter.click();
      await siteAdminPage.getByRole('option', { name: /수원랩/ }).click();
      await siteAdminPage.waitForTimeout(500);

      // 2. 상태 필터 적용
      const statusFilter = siteAdminPage.locator('#filter-status');
      await statusFilter.click();
      await siteAdminPage.getByRole('option', { name: '사용 가능' }).click();
      await siteAdminPage.waitForTimeout(500);

      // 3. 교정 방법 필터 적용
      const calibrationMethodFilter = siteAdminPage.locator('#filter-calibration');
      await calibrationMethodFilter.click();
      await siteAdminPage.getByRole('option', { name: /외부 교정/i }).click();

      // Wait for URL to update
      await siteAdminPage.waitForTimeout(1000);

      // URL 검증
      const currentUrl = siteAdminPage.url();
      expect(currentUrl).toContain('site=suwon');
      expect(currentUrl).toContain('status=available');
      expect(currentUrl).toContain('calibrationMethod=external_calibration');

      // 필터 뱃지 확인
      await expect(siteAdminPage.getByText(/사이트:.*수원랩/)).toBeVisible({ timeout: 10000 });
      await expect(siteAdminPage.getByText(/상태:.*사용 가능/)).toBeVisible({ timeout: 10000 });
      await expect(siteAdminPage.getByText(/교정:.*외부 교정/)).toBeVisible({ timeout: 10000 });

      console.log('[Test] ✅ Multiple filters applied with AND logic');
    });

    test('should apply filters with search query', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      // Wait for client-side hydration to complete
      await testOperatorPage.waitForTimeout(1500);

      // 상태 필터 + 검색어
      const statusFilter = testOperatorPage.locator('#filter-status');
      await statusFilter.click();
      await testOperatorPage.getByRole('option', { name: '사용 가능' }).click();
      await testOperatorPage.waitForTimeout(500);

      const searchInput = testOperatorPage.getByRole('searchbox');
      await searchInput.fill('분석기');
      await searchInput.press('Enter');

      // Wait for results
      await testOperatorPage.waitForTimeout(1000);

      // URL 검증
      const currentUrl = testOperatorPage.url();
      expect(currentUrl).toContain('status=available');
      expect(currentUrl).toContain('search=');

      console.log('[Test] ✅ Status filter and search query applied');
    });
  });

  test.describe('9.2. Filter reset clears all filters', () => {
    test('should clear all filters when clicking reset button', async ({ siteAdminPage }) => {
      // Apply filters through UI
      await siteAdminPage.goto('/equipment');
      await siteAdminPage.waitForLoadState('networkidle');

      // Wait for client-side hydration to complete
      await siteAdminPage.waitForTimeout(1500);

      const siteFilter = siteAdminPage.locator('#filter-site');
      await siteFilter.click();
      await siteAdminPage.getByRole('option', { name: /수원랩/ }).click();
      await siteAdminPage.waitForTimeout(300);

      const statusFilter = siteAdminPage.locator('#filter-status');
      await statusFilter.click();
      await siteAdminPage.getByRole('option', { name: '사용 가능' }).click();
      await siteAdminPage.waitForTimeout(300);

      const classificationFilter = siteAdminPage.locator('#filter-classification');
      await classificationFilter.click();
      await siteAdminPage.getByRole('option', { name: /FCC EMC\/RF/i }).click();
      await siteAdminPage.waitForTimeout(1000);

      // 필터 뱃지 확인 (최소 3개)
      await expect(siteAdminPage.getByText(/사이트:.*수원랩/)).toBeVisible({ timeout: 10000 });
      await expect(siteAdminPage.getByText(/상태:.*사용 가능/)).toBeVisible({ timeout: 10000 });
      await expect(siteAdminPage.getByText(/분류:.*FCC EMC\/RF/)).toBeVisible({ timeout: 10000 });

      // 초기화 버튼 클릭
      const resetButton = siteAdminPage.getByRole('button', { name: /초기화|필터.*초기화/i });
      await resetButton.click();

      // Wait for URL to update
      await siteAdminPage.waitForTimeout(1000);

      // URL 확인: 쿼리 파라미터 없음
      const currentUrl = siteAdminPage.url();
      const urlObj = new URL(currentUrl);
      expect(urlObj.searchParams.has('site')).toBe(false);
      expect(urlObj.searchParams.has('status')).toBe(false);
      expect(urlObj.searchParams.has('classification')).toBe(false);

      // 필터 뱃지 제거 확인
      await expect(siteAdminPage.getByText(/사이트:.*수원랩/)).not.toBeVisible();
      await expect(siteAdminPage.getByText(/상태:.*사용 가능/)).not.toBeVisible();
      await expect(siteAdminPage.getByText(/분류:.*FCC EMC\/RF/)).not.toBeVisible();

      console.log('[Test] ✅ All filters cleared successfully');
    });
  });

  test.describe('9.3. Individual filter removal preserves other filters', () => {
    test('should remove only the clicked filter', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment?status=available&classification=fcc_emc_rf');
      await testOperatorPage.waitForLoadState('networkidle');

      // Wait for client-side hydration to complete
      await testOperatorPage.waitForTimeout(1500);

      // 초기 필터 뱃지 확인
      await expect(testOperatorPage.getByText(/상태:.*사용 가능/)).toBeVisible({ timeout: 10000 });
      await expect(testOperatorPage.getByText(/분류:.*FCC EMC\/RF/)).toBeVisible({
        timeout: 10000,
      });

      // 상태 필터 제거 (X 버튼 클릭)
      const removeButton = testOperatorPage.getByRole('button', {
        name: '상태: 사용 가능 필터 제거',
      });
      await removeButton.click();

      // Wait for URL to update
      await testOperatorPage.waitForTimeout(500);

      // URL 확인
      const currentUrl = testOperatorPage.url();
      expect(currentUrl).not.toContain('status=');
      expect(currentUrl).toContain('classification=fcc_emc_rf');

      // 필터 뱃지 확인
      await expect(testOperatorPage.getByText(/상태:.*사용 가능/)).not.toBeVisible();
      await expect(testOperatorPage.getByText(/분류:.*FCC EMC\/RF/)).toBeVisible();

      console.log('[Test] ✅ Individual filter removed, others preserved');
    });

    test('should maintain filter state when removing search', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment?status=available&search=테스트');
      await testOperatorPage.waitForLoadState('networkidle');

      // Wait for client-side hydration to complete
      await testOperatorPage.waitForTimeout(1500);

      // 검색어 제거 (입력창 지우기)
      const searchInput = testOperatorPage.getByRole('searchbox');
      await searchInput.clear();
      await searchInput.press('Enter');

      // Wait for URL to update
      await testOperatorPage.waitForTimeout(500);

      // URL 검증
      const currentUrl = testOperatorPage.url();
      const urlObj = new URL(currentUrl);
      expect(urlObj.searchParams.has('search')).toBe(false);
      expect(urlObj.searchParams.get('status')).toBe('available');

      // 검색 입력창 비어있음
      await expect(searchInput).toHaveValue('');

      // 상태 필터 뱃지 유지
      await expect(testOperatorPage.getByText(/상태:.*사용 가능/)).toBeVisible();

      console.log('[Test] ✅ Search removed, status filter preserved');
    });
  });

  test.describe('9.4. Calibration due filter works independently from status filter', () => {
    test('should combine status and calibration due filters', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      // 1. 상태 필터: 사용 가능
      const statusFilter = testOperatorPage.locator('#filter-status');
      await statusFilter.click();
      await testOperatorPage.getByRole('option', { name: '사용 가능' }).click();
      await testOperatorPage.waitForTimeout(500);

      // 2. 교정 기한 필터: 기한 초과
      const calibrationDueFilter = testOperatorPage.locator('#filter-calibration-due');
      await calibrationDueFilter.click();
      await testOperatorPage.getByRole('option', { name: /기한 초과/i }).click();

      // Wait for URL to update
      await testOperatorPage.waitForTimeout(1000);

      // URL 검증
      const currentUrl = testOperatorPage.url();
      expect(currentUrl).toContain('status=available');
      expect(currentUrl).toContain('calibrationDueFilter=overdue');

      console.log('[Test] ✅ Status and calibration due filters work independently');
    });

    test('should show equipment that matches status but not calibration due when filter removed', async ({
      testOperatorPage,
    }) => {
      // 먼저 두 필터 모두 적용
      await testOperatorPage.goto('/equipment?status=available&calibrationDueFilter=overdue');
      await testOperatorPage.waitForLoadState('networkidle');

      // 초기 필터 뱃지 확인
      await expect(testOperatorPage.getByText(/교정기한:.*기한 초과/)).toBeVisible();

      // 교정 기한 필터 제거
      const removeButton = testOperatorPage.getByRole('button', {
        name: '교정기한: 기한 초과 필터 제거',
      });
      await removeButton.click();

      // Wait for URL to update
      await testOperatorPage.waitForTimeout(500);

      // URL 검증: 교정 기한 필터 제거, 상태 필터 유지
      const currentUrl = testOperatorPage.url();
      expect(currentUrl).toContain('status=available');
      expect(currentUrl).not.toContain('calibrationDueFilter');

      // 상태 필터 뱃지 유지
      await expect(testOperatorPage.getByText(/상태:.*사용 가능/)).toBeVisible();

      console.log('[Test] ✅ Removing calibration due filter preserves status filter');
    });
  });

  test.describe('Additional: Complex filter combinations', () => {
    test('should apply 5+ filters simultaneously', async ({ siteAdminPage }) => {
      await siteAdminPage.goto('/equipment');
      await siteAdminPage.waitForLoadState('networkidle');

      // Wait for client-side hydration to complete
      await siteAdminPage.waitForTimeout(1500);

      // 5개 필터 적용
      const siteFilter = siteAdminPage.locator('#filter-site');
      await siteFilter.click();
      await siteAdminPage.getByRole('option', { name: /수원랩/ }).click();
      await siteAdminPage.waitForTimeout(300);

      const statusFilter = siteAdminPage.locator('#filter-status');
      await statusFilter.click();
      await siteAdminPage.getByRole('option', { name: '사용 가능' }).click();
      await siteAdminPage.waitForTimeout(300);

      const calibrationMethodFilter = siteAdminPage.locator('#filter-calibration');
      await calibrationMethodFilter.click();
      await siteAdminPage.getByRole('option', { name: /외부 교정/i }).click();
      await siteAdminPage.waitForTimeout(300);

      const sharedFilter = siteAdminPage.locator('#filter-shared');
      await sharedFilter.click();
      await siteAdminPage.getByRole('option', { name: /일반장비/i }).click();
      await siteAdminPage.waitForTimeout(300);

      const calibrationDueFilter = siteAdminPage.locator('#filter-calibration-due');
      await calibrationDueFilter.click();
      await siteAdminPage.getByRole('option', { name: /정상/i }).click();

      // Wait for all filters to be applied
      await siteAdminPage.waitForTimeout(1000);

      // URL 검증
      const currentUrl = siteAdminPage.url();
      expect(currentUrl).toContain('site=suwon');
      expect(currentUrl).toContain('status=available');
      expect(currentUrl).toContain('calibrationMethod=external_calibration');
      expect(currentUrl).toContain('isShared=normal');
      expect(currentUrl).toContain('calibrationDueFilter=normal');

      // 활성 필터 뱃지 확인
      await expect(siteAdminPage.getByText(/사이트:.*수원랩/)).toBeVisible({ timeout: 10000 });
      await expect(siteAdminPage.getByText(/상태:.*사용 가능/)).toBeVisible({ timeout: 10000 });
      await expect(siteAdminPage.getByText(/교정:.*외부 교정/)).toBeVisible({ timeout: 10000 });
      await expect(siteAdminPage.getByText(/장비.*구분:.*일반장비/)).toBeVisible({
        timeout: 10000,
      });
      await expect(siteAdminPage.getByText(/교정기한:.*정상/)).toBeVisible({ timeout: 10000 });

      console.log('[Test] ✅ 5+ filters applied successfully');
    });
  });
});
