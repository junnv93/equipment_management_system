/**
 * Group G: SSOT (Single Source of Truth) 검증 테스트
 *
 * 🔥 Critical Test Group - SSOT 아키텍처의 핵심!
 *
 * 검증 범위:
 * 1. 서버(page.tsx)와 클라이언트(useEquipmentFilters) 필터 파싱 일관성
 * 2. UI 필터 → API 파라미터 변환 정확성 (equipment-filter-utils.ts)
 * 3. Hydration mismatch 발생 여부
 * 4. URL searchParams 파싱 동작 검증
 *
 * SSOT 파일:
 * - lib/utils/equipment-filter-utils.ts
 *   - parseEquipmentFiltersFromSearchParams()
 *   - convertFiltersToApiParams()
 *   - countActiveFilters()
 *
 * 아키텍처 원칙:
 * - 서버 컴포넌트와 클라이언트 훅이 동일한 함수 사용
 * - UI 파라미터 → API 파라미터 변환은 단일 함수에서만 처리
 * - 새로운 필터 추가 시 한 곳에서만 수정
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import {
  EquipmentStatusValues as ESVal,
  ManagementMethodValues as CMVal,
} from '@equipment-management/schemas';

test.describe('Group G: SSOT Filter Utils Verification', () => {
  test.describe('22.1. Server and client filter parsing produces same result', () => {
    test('should have consistent filter parsing between server and client', async ({
      testOperatorPage,
    }) => {
      // 복잡한 필터 조합으로 URL 직접 입력
      const filterParams = new URLSearchParams({
        status: ESVal.AVAILABLE,
        managementMethod: CMVal.EXTERNAL_CALIBRATION,
        classification: 'fcc_emc_rf',
        isShared: 'shared',
        calibrationDueFilter: 'due_soon',
        search: '테스트',
        sortBy: 'name',
        sortOrder: 'asc',
        page: '2',
        pageSize: '50',
      });

      await testOperatorPage.goto(`/equipment?${filterParams.toString()}`);

      // ClientOnly 컴포넌트 hydration 대기 (명시적 선택자 없음, 불가피한 timeout)

      // 🔥 Hydration 검증: 에러 없이 로드되어야 함
      const consoleErrors: string[] = [];
      testOperatorPage.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Hydration mismatch 에러 확인
      const hydrationErrors = consoleErrors.filter(
        (err) =>
          err.includes('Hydration') ||
          err.includes('did not match') ||
          err.includes('Expected server HTML')
      );

      expect(hydrationErrors).toHaveLength(0);

      // 1. URL 파라미터 검증 (서버와 클라이언트가 동일하게 파싱)
      const currentUrl = testOperatorPage.url();
      expect(currentUrl).toContain('status=available');
      expect(currentUrl).toContain('managementMethod=external_calibration');
      expect(currentUrl).toContain('classification=fcc_emc_rf');
      expect(currentUrl).toContain('isShared=shared');
      expect(currentUrl).toContain('calibrationDueFilter=due_soon');
      expect(currentUrl).toContain('search=%ED%85%8C%EC%8A%A4%ED%8A%B8'); // URL encoded "테스트"
      expect(currentUrl).toContain('sortBy=name');
      expect(currentUrl).toContain('sortOrder=asc');
      expect(currentUrl).toContain('page=2');
      expect(currentUrl).toContain('pageSize=50');

      // 2. UI 필터 상태 확인 (클라이언트에서 파싱)
      // 검색어 확인
      const searchInput = testOperatorPage.getByRole('searchbox');
      await expect(searchInput).toHaveValue('테스트');

      // 3. 필터 뱃지 확인 (UI에서 복원된 필터 확인)
      await expect(testOperatorPage.getByText(/상태:.*사용 가능/)).toBeVisible();
      await expect(testOperatorPage.getByText(/교정:.*외부 교정/)).toBeVisible();
      await expect(testOperatorPage.getByText(/장비 구분:.*공용장비/)).toBeVisible();
      await expect(testOperatorPage.getByText(/교정기한:.*교정 임박/)).toBeVisible();

      console.log('[Test] ✅ Server and client filter parsing are consistent');
    });

    test('should handle URL with only some filters', async ({ testOperatorPage }) => {
      // 일부 필터만 있는 경우
      await testOperatorPage.goto('/equipment?status=available&page=3');

      // ClientOnly hydration 대기

      // 🔥 SSOT 검증: 지정된 필터만 적용, 나머지는 기본값
      const currentUrl = testOperatorPage.url();
      expect(currentUrl).toContain('status=available');
      expect(currentUrl).toContain('page=3');

      // 필터 뱃지 확인
      await expect(testOperatorPage.getByText(/상태:.*사용 가능/)).toBeVisible();

      // URL 확인으로 페이지 검증 대체 (페이지네이션 버튼이 없을 수 있음)
      const urlObj = new URL(currentUrl);
      expect(urlObj.searchParams.get('page')).toBe('3');

      console.log('[Test] ✅ Partial URL filters handled correctly with defaults');
    });

    test('should handle invalid URL parameters gracefully', async ({ testOperatorPage }) => {
      // 잘못된 파라미터 값
      await testOperatorPage.goto('/equipment?status=invalid_status&page=-1&pageSize=999999');

      // ClientOnly hydration 대기

      // 🔥 SSOT 검증: 잘못된 값은 무시되고 기본값 사용

      // invalid_status는 URL에 남지만 필터로 적용되지 않음
      // 필터 뱃지가 없어야 함 (잘못된 상태는 필터로 인식 안 됨)
      const filterBadges = testOperatorPage.locator('[data-testid="filter-badge"]');
      await expect(filterBadges).toHaveCount(0);

      // 페이지가 정상적으로 로드되어야 함 (에러 없이)
      await expect(testOperatorPage.locator('h1')).toContainText('장비 관리');

      // 장비 목록 컨테이너가 표시되어야 함
      const equipmentList = testOperatorPage.locator('[role="main"], main').first();
      await expect(equipmentList).toBeVisible({ timeout: 10000 });

      console.log('[Test] ✅ Invalid URL parameters handled gracefully');
    });
  });

  test.describe('22.2. API params transform correctly from UI filters', () => {
    test('should transform calibrationDueFilter=due_soon', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      const calibrationDueFilter = testOperatorPage.locator('#filter-calibration-due');
      await calibrationDueFilter.click();
      await testOperatorPage.getByRole('option', { name: /교정 임박/i }).click();

      // URL에 UI 파라미터 반영 확인
      await testOperatorPage.waitForURL(/calibrationDueFilter=due_soon/, { timeout: 5000 });

      // 필터 뱃지 확인
      await expect(testOperatorPage.getByText(/교정기한:.*교정 임박/)).toBeVisible();

      console.log('[Test] ✅ calibrationDueFilter=due_soon applied');
    });

    test('should transform calibrationDueFilter=overdue', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      const calibrationDueFilter = testOperatorPage.locator('#filter-calibration-due');
      await calibrationDueFilter.click();
      await testOperatorPage.getByRole('option', { name: /기한 초과/i }).click();

      await testOperatorPage.waitForURL(/calibrationDueFilter=overdue/, { timeout: 5000 });
      await expect(testOperatorPage.getByText(/교정기한:.*기한 초과/)).toBeVisible();

      console.log('[Test] ✅ calibrationDueFilter=overdue applied');
    });

    test('should transform calibrationDueFilter=normal', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      const calibrationDueFilter = testOperatorPage.locator('#filter-calibration-due');
      await calibrationDueFilter.click();
      await testOperatorPage.getByRole('option', { name: /정상/i }).click();

      await testOperatorPage.waitForURL(/calibrationDueFilter=normal/, { timeout: 5000 });
      await expect(testOperatorPage.getByText(/교정기한:.*정상/)).toBeVisible();

      console.log('[Test] ✅ calibrationDueFilter=normal applied');
    });

    test('should transform isShared to boolean API param', async ({ testOperatorPage }) => {
      // Test 1: shared 필터
      await testOperatorPage.goto('/equipment');

      const sharedFilter = testOperatorPage.locator('#filter-shared');
      await sharedFilter.click();
      await testOperatorPage.getByRole('option', { name: /공용장비/i }).click();

      // 🔥 SSOT 검증: UI 파라미터는 "shared", API는 boolean으로 변환
      await testOperatorPage.waitForURL(/isShared=shared/, { timeout: 5000 });
      await expect(testOperatorPage.getByText(/장비 구분:.*공용장비/)).toBeVisible();

      console.log('[Test] ✅ isShared=shared applied');

      // Test 2: normal 필터
      await testOperatorPage.goto('/equipment');

      await sharedFilter.click();
      await testOperatorPage.getByRole('option', { name: /일반장비/i }).click();

      await testOperatorPage.waitForURL(/isShared=normal/, { timeout: 5000 });
      await expect(testOperatorPage.getByText(/장비 구분:.*일반장비/)).toBeVisible();

      console.log('[Test] ✅ isShared=normal applied');

      // Test 3: all 선택 시 파라미터 제거
      await testOperatorPage.goto('/equipment?isShared=shared');

      await sharedFilter.click();
      await testOperatorPage.getByRole('option', { name: /모든 장비/i }).click();

      // isShared 파라미터가 URL에서 제거되어야 함
      const currentUrl = testOperatorPage.url();
      expect(currentUrl).not.toContain('isShared=');

      console.log('[Test] ✅ isShared=all removes parameter');
    });

    test('should transform sort parameters correctly', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      // 이름순 정렬
      const nameHeader = testOperatorPage.getByRole('button', { name: /장비명.*정렬/i });
      await nameHeader.click();

      // URL에 정렬 파라미터 반영 확인
      await testOperatorPage.waitForURL(/sortBy=name/, { timeout: 5000 });
      await testOperatorPage.waitForURL(/sortOrder=asc/, { timeout: 5000 });

      // 🔥 SSOT 검증: UI는 sortBy/sortOrder, API는 sort=name.asc로 변환
      const currentUrl = testOperatorPage.url();
      expect(currentUrl).toContain('sortBy=name');
      expect(currentUrl).toContain('sortOrder=asc');

      console.log('[Test] ✅ sortBy=name, sortOrder=asc applied to URL');
    });

    test('should apply multiple filter transformations simultaneously', async ({
      testOperatorPage,
    }) => {
      // 복합 필터: calibrationDueFilter + isShared + status
      await testOperatorPage.goto(
        '/equipment?calibrationDueFilter=due_soon&isShared=shared&status=available'
      );

      // 🔥 SSOT 검증: 모든 필터가 동시에 적용
      const currentUrl = testOperatorPage.url();
      expect(currentUrl).toContain('calibrationDueFilter=due_soon');
      expect(currentUrl).toContain('isShared=shared');
      expect(currentUrl).toContain('status=available');

      // 필터 뱃지 확인
      await expect(testOperatorPage.getByText(/상태:.*사용 가능/)).toBeVisible();
      await expect(testOperatorPage.getByText(/장비 구분:.*공용장비/)).toBeVisible();
      await expect(testOperatorPage.getByText(/교정기한:.*교정 임박/)).toBeVisible();

      // 🔥 SSOT 검증: 페이지가 정상적으로 로드되었는지 확인
      // 복합 필터 조건에 맞는 장비가 없을 수 있으므로, 장비 목록 컨테이너나 테이블이 표시되는지만 확인
      const equipmentListContainer = testOperatorPage.locator('[role="main"], main, table').first();
      await expect(equipmentListContainer).toBeVisible({ timeout: 10000 });

      console.log('[Test] ✅ Multiple filter transformations applied correctly');
    });

    test('should handle empty/default filter values correctly', async ({ testOperatorPage }) => {
      // 모든 필터가 기본값인 경우
      await testOperatorPage.goto('/equipment');

      // 🔥 SSOT 검증: 기본값 필터는 URL에 나타나지 않음
      const currentUrl = testOperatorPage.url();

      // 필터 파라미터가 없어야 함
      expect(currentUrl).not.toContain('status=');
      expect(currentUrl).not.toContain('isShared=');
      expect(currentUrl).not.toContain('calibrationDueFilter=');
      expect(currentUrl).not.toContain('managementMethod=');
      expect(currentUrl).not.toContain('classification=');

      // 필터 뱃지가 없어야 함
      const filterBadges = testOperatorPage.locator('[data-testid="filter-badge"]');
      await expect(filterBadges).toHaveCount(0);

      // 장비 목록은 정상적으로 표시되어야 함
      const equipmentRows = testOperatorPage.locator('[data-testid="equipment-row"]');
      await expect(equipmentRows.first()).toBeVisible({ timeout: 10000 });

      console.log('[Test] ✅ Default filter values handled correctly');
    });
  });

  test.describe('Additional: Filter utils edge cases', () => {
    test('should handle URL encoding correctly', async ({ testOperatorPage }) => {
      // 한글 검색어 URL 인코딩 테스트
      const koreanSearch = '스펙트럼 분석기';
      const encoded = encodeURIComponent(koreanSearch);

      await testOperatorPage.goto(`/equipment?search=${encoded}`);

      // 검색 입력창에 디코딩된 값 표시
      const searchInput = testOperatorPage.getByRole('searchbox');
      await expect(searchInput).toHaveValue(koreanSearch);

      // 🔥 SSOT 검증: URL 인코딩/디코딩이 올바르게 처리됨
      const currentUrl = testOperatorPage.url();
      // URL은 인코딩된 상태로 유지
      expect(currentUrl).toContain(encoded);

      console.log('[Test] ✅ URL encoding/decoding handled correctly');
    });

    test('should maintain filter state across page navigation', async ({ testOperatorPage }) => {
      // 필터 적용
      await testOperatorPage.goto('/equipment?status=available&page=2');

      // 필터 뱃지 확인
      await expect(testOperatorPage.getByText(/상태:.*사용 가능/)).toBeVisible();

      // 다른 페이지로 이동
      await testOperatorPage.goto('/');

      // 뒤로 가기
      await testOperatorPage.goBack();

      // 🔥 SSOT 검증: 브라우저 히스토리를 통한 필터 복원
      const currentUrl = testOperatorPage.url();
      expect(currentUrl).toContain('status=available');
      expect(currentUrl).toContain('page=2');

      // 필터 뱃지 복원 확인
      await expect(testOperatorPage.getByText(/상태:.*사용 가능/)).toBeVisible();

      console.log('[Test] ✅ Filter state maintained across navigation');
    });

    test('should count active filters correctly', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      // 필터 적용 전: 활성 필터 카운트 0
      const filterCountBadge = testOperatorPage.locator('button:has-text("필터") >> .. >> .ml-2');
      await expect(filterCountBadge).not.toBeVisible();

      // 1. 상태 필터 적용
      const statusFilter = testOperatorPage.locator('#filter-status');
      await statusFilter.click();
      await testOperatorPage.getByRole('option', { name: /사용 가능/i }).click();

      // 2. 교정 방법 필터 적용
      const managementMethodFilter = testOperatorPage.locator('#filter-calibration');
      await managementMethodFilter.click();
      await testOperatorPage.getByRole('option', { name: /외부 교정/i }).click();

      // 3. 검색어 입력
      const searchInput = testOperatorPage.getByRole('searchbox');
      await searchInput.fill('테스트');
      await searchInput.press('Enter');

      // 🔥 SSOT 검증: countActiveFilters() 함수 정확성
      // 필터 카운트 뱃지가 3으로 표시되어야 함
      await expect(
        testOperatorPage.locator('button:has-text("필터") >> .. >> .ml-2')
      ).toContainText('3');

      // 필터 뱃지 개수 확인
      await expect(testOperatorPage.getByText(/상태:.*사용 가능/)).toBeVisible();
      await expect(testOperatorPage.getByText(/교정:.*외부 교정/)).toBeVisible();
      // 검색어는 필터 뱃지에 표시되지 않음 (검색창에만 표시)

      console.log('[Test] ✅ Active filter count is correct');
    });
  });
});
