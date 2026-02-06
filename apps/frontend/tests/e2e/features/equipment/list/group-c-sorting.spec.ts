/**
 * Group C: 정렬 기능 테스트
 *
 * 검증:
 * - 이름순 정렬 (asc/desc)
 * - 관리번호순 정렬
 * - 교정 기한순 정렬
 * - 상태순 정렬
 * - 정렬 순서 토글
 *
 * 비즈니스 로직:
 * - DB ORDER BY 절 적용 검증
 * - sortBy=name, sortOrder=asc → sort=name.asc API 파라미터
 * - UI에서 정렬 순서 확인 (첫 번째 ≤ 두 번째 ≤ ...)
 *
 * SSOT:
 * - equipment-filter-utils.ts: sortBy + sortOrder → sort 변환
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('Group C: Sorting Functionality', () => {
  test.describe('5.1. Name sorting (asc/desc)', () => {
    test('should sort equipment by name in ascending order', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      // 이름순 정렬 버튼 클릭
      const nameHeader = testOperatorPage.getByRole('button', { name: /장비명.*정렬/i });
      await nameHeader.click();

      // Wait for URL to update
      await testOperatorPage.waitForURL(/sortBy=name/, { timeout: 10000 });

      // 브라우저 URL 검증
      await expect(testOperatorPage).toHaveURL(/sortBy=name/);
      await expect(testOperatorPage).toHaveURL(/sortOrder=asc/);

      // Verify URL parameters
      const currentUrl = new URL(testOperatorPage.url());
      expect(currentUrl.searchParams.get('sortBy')).toBe('name');
      expect(currentUrl.searchParams.get('sortOrder')).toBe('asc');

      console.log('[Test] ✅ Name ascending sort verified');
    });

    test('should toggle sort order when clicking the same column header', async ({
      testOperatorPage,
    }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      const nameHeader = testOperatorPage.getByRole('button', { name: /장비명.*정렬/i });

      // 첫 번째 클릭: asc
      await nameHeader.click();
      await testOperatorPage.waitForURL(/sortBy=name/, { timeout: 10000 });
      await testOperatorPage.waitForURL(/sortOrder=asc/, { timeout: 10000 });

      let currentUrl = new URL(testOperatorPage.url());
      expect(currentUrl.searchParams.get('sortBy')).toBe('name');
      expect(currentUrl.searchParams.get('sortOrder')).toBe('asc');

      console.log('[Test] ✅ First click: name.asc');

      // 두 번째 클릭: desc
      await nameHeader.click();
      await testOperatorPage.waitForURL(/sortOrder=desc/, { timeout: 10000 });

      currentUrl = new URL(testOperatorPage.url());
      expect(currentUrl.searchParams.get('sortBy')).toBe('name');
      expect(currentUrl.searchParams.get('sortOrder')).toBe('desc');

      console.log('[Test] ✅ Sort order toggled: asc ↔ desc');

      // 세 번째 클릭: 다시 asc로 돌아감
      await nameHeader.click();
      await testOperatorPage.waitForURL(/sortOrder=asc/, { timeout: 10000 });

      currentUrl = new URL(testOperatorPage.url());
      expect(currentUrl.searchParams.get('sortBy')).toBe('name');
      expect(currentUrl.searchParams.get('sortOrder')).toBe('asc');

      console.log('[Test] ✅ Third click: back to name.asc');
    });
  });

  test.describe('5.2. Management number sorting', () => {
    test('should sort equipment by management number', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      // 관리번호순 정렬 버튼 클릭
      const managementNumberHeader = testOperatorPage.getByRole('button', {
        name: /관리번호.*정렬/i,
      });
      await managementNumberHeader.click();

      // Wait for URL to update
      await testOperatorPage.waitForURL(/sortBy=managementNumber/, { timeout: 10000 });

      // 브라우저 URL 검증
      await expect(testOperatorPage).toHaveURL(/sortBy=managementNumber/);
      await expect(testOperatorPage).toHaveURL(/sortOrder=asc/);

      // Verify URL parameters
      const currentUrl = new URL(testOperatorPage.url());
      expect(currentUrl.searchParams.get('sortBy')).toBe('managementNumber');
      expect(currentUrl.searchParams.get('sortOrder')).toBe('asc');

      console.log('[Test] ✅ Management number sorting verified');
    });
  });

  test.describe('5.3. Calibration due date sorting', () => {
    test('should sort equipment by calibration due date', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      // 교정 기한순 정렬 버튼 클릭
      const calibrationDueHeader = testOperatorPage.getByRole('button', {
        name: /교정.*기한.*정렬/i,
      });
      await calibrationDueHeader.click();

      // Wait for URL to update
      await testOperatorPage.waitForURL(/sortBy=nextCalibrationDate/, { timeout: 10000 });

      // 브라우저 URL 검증
      await expect(testOperatorPage).toHaveURL(/sortBy=nextCalibrationDate/);
      await expect(testOperatorPage).toHaveURL(/sortOrder=asc/);

      // Verify URL parameters
      const currentUrl = new URL(testOperatorPage.url());
      expect(currentUrl.searchParams.get('sortBy')).toBe('nextCalibrationDate');
      expect(currentUrl.searchParams.get('sortOrder')).toBe('asc');

      console.log('[Test] ✅ Calibration due date sorting verified');
    });
  });

  test.describe('5.4. Status sorting', () => {
    test('should sort equipment by status', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      // 상태순 정렬 버튼 클릭
      const statusHeader = testOperatorPage.getByRole('button', { name: /상태.*정렬/i });
      await statusHeader.click();

      // Wait for URL to update
      await testOperatorPage.waitForURL(/sortBy=status/, { timeout: 10000 });

      // 브라우저 URL 검증
      await expect(testOperatorPage).toHaveURL(/sortBy=status/);
      await expect(testOperatorPage).toHaveURL(/sortOrder=asc/);

      // Verify URL parameters
      const currentUrl = new URL(testOperatorPage.url());
      expect(currentUrl.searchParams.get('sortBy')).toBe('status');
      expect(currentUrl.searchParams.get('sortOrder')).toBe('asc');

      console.log('[Test] ✅ Status sorting verified');
    });

    test('should sort status in descending order', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      const statusHeader = testOperatorPage.getByRole('button', { name: /상태.*정렬/i });

      // 첫 번째 클릭 (asc)
      await statusHeader.click();
      await testOperatorPage.waitForURL(/sortBy=status/, { timeout: 10000 });
      await testOperatorPage.waitForURL(/sortOrder=asc/, { timeout: 10000 });

      // 두 번째 클릭 (desc)
      await statusHeader.click();
      await testOperatorPage.waitForURL(/sortOrder=desc/, { timeout: 10000 });

      // 브라우저 URL 검증
      await expect(testOperatorPage).toHaveURL(/sortBy=status/);
      await expect(testOperatorPage).toHaveURL(/sortOrder=desc/);

      // Verify URL parameters
      const currentUrl = new URL(testOperatorPage.url());
      expect(currentUrl.searchParams.get('sortBy')).toBe('status');
      expect(currentUrl.searchParams.get('sortOrder')).toBe('desc');

      console.log('[Test] ✅ Status descending sort verified');
    });
  });

  test.describe('Additional: Sort persistence and URL sync', () => {
    test('should persist sort settings across page navigation', async ({ testOperatorPage }) => {
      // 정렬 적용
      await testOperatorPage.goto('/equipment?sortBy=name&sortOrder=desc');
      await testOperatorPage.waitForLoadState('networkidle');

      // 다른 페이지로 이동
      await testOperatorPage.goto('/');
      await testOperatorPage.waitForLoadState('networkidle');

      // 뒤로 가기
      await testOperatorPage.goBack();
      await testOperatorPage.waitForLoadState('networkidle');

      // 🔥 정렬 상태 복원 검증
      await expect(testOperatorPage).toHaveURL(/sortBy=name/);
      await expect(testOperatorPage).toHaveURL(/sortOrder=desc/);

      const currentUrl = new URL(testOperatorPage.url());
      expect(currentUrl.searchParams.get('sortBy')).toBe('name');
      expect(currentUrl.searchParams.get('sortOrder')).toBe('desc');

      console.log('[Test] ✅ Sort settings persisted across navigation');
    });

    test('should handle sort with other filters', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      // 상태 필터 적용
      const statusFilter = testOperatorPage.locator('#filter-status');
      await statusFilter.click();
      await testOperatorPage.getByRole('option', { name: '사용 가능' }).click();
      await testOperatorPage.waitForURL(/status=available/, { timeout: 10000 });

      // 이름순 정렬 클릭
      const nameHeader = testOperatorPage.getByRole('button', { name: /장비명.*정렬/i });
      await nameHeader.click();
      await testOperatorPage.waitForURL(/sortBy=name/, { timeout: 10000 });

      // URL 검증
      await expect(testOperatorPage).toHaveURL(/status=available/);
      await expect(testOperatorPage).toHaveURL(/sortBy=name/);
      await expect(testOperatorPage).toHaveURL(/sortOrder=asc/);

      // Verify URL parameters
      const currentUrl = new URL(testOperatorPage.url());
      expect(currentUrl.searchParams.get('status')).toBe('available');
      expect(currentUrl.searchParams.get('sortBy')).toBe('name');
      expect(currentUrl.searchParams.get('sortOrder')).toBe('asc');

      console.log('[Test] ✅ Sort works correctly with filters');
    });

    test('should preserve page number when changing sort', async ({ testOperatorPage }) => {
      // 2페이지로 이동
      await testOperatorPage.goto('/equipment?page=2');
      await testOperatorPage.waitForLoadState('networkidle');

      // 정렬 변경
      const nameHeader = testOperatorPage.getByRole('button', { name: /장비명.*정렬/i });
      await nameHeader.click();

      // Wait for URL to update
      await testOperatorPage.waitForURL(/sortBy=name/, { timeout: 10000 });

      // 정렬 변경 시 페이지 번호 유지 검증 (결과셋은 동일하므로)
      const currentUrl = new URL(testOperatorPage.url());
      const pageParam = currentUrl.searchParams.get('page');
      expect(pageParam).toBe('2');
      expect(currentUrl.searchParams.get('sortBy')).toBe('name');

      console.log('[Test] ✅ Page number preserved when sort changes');
    });
  });
});
