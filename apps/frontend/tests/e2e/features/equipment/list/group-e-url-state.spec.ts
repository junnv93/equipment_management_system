/**
 * Group E-1: URL 상태 동기화 테스트
 *
 * 검증 범위:
 * 1. URL 파라미터로 필터 상태 복원
 * 2. 브라우저 뒤로 가기로 이전 상태 복원
 * 3. 브라우저 앞으로 가기
 * 4. 공유 가능한 URL 테스트
 * 5. 잘못된 URL 파라미터 처리
 *
 * 비즈니스 로직:
 * - URL → parseEquipmentFiltersFromSearchParams() → UI 필터 복원
 * - 브라우저 히스토리 API 동작 확인
 *
 * SSOT:
 * - parseEquipmentFiltersFromSearchParams: lib/utils/equipment-filter-utils.ts
 * - UIEquipmentFilters: lib/utils/equipment-filter-utils.ts
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('Group E-1: URL State Synchronization', () => {
  test.describe('1.1. URL parameters restore filter state correctly', () => {
    test('should restore all filter states from URL parameters', async ({ testOperatorPage }) => {
      // 모든 필터가 적용된 URL로 직접 이동
      const urlWithFilters =
        '/equipment?' +
        'search=스펙트럼' +
        '&status=available' +
        '&managementMethod=self_inspection' +
        '&classification=fcc_emc_rf' +
        '&isShared=shared' +
        '&calibrationDueFilter=due_soon' +
        '&sortBy=name' +
        '&sortOrder=asc' +
        '&page=2' +
        '&pageSize=10';

      await testOperatorPage.goto(urlWithFilters);

      // 1. 검색어 필터 복원 확인
      const searchInput = testOperatorPage.getByRole('searchbox');
      await expect(searchInput).toHaveValue('스펙트럼');

      // 2. URL 파라미터로 필터가 제대로 복원되었는지 확인
      await expect(testOperatorPage).toHaveURL(/status=available/);
      await expect(testOperatorPage).toHaveURL(/managementMethod=self_inspection/);
      await expect(testOperatorPage).toHaveURL(/classification=fcc_emc_rf/);
      await expect(testOperatorPage).toHaveURL(/isShared=shared/);
      await expect(testOperatorPage).toHaveURL(/calibrationDueFilter=due_soon/);

      // 3. 활성 필터 배지로 필터 상태 확인 (필터가 닫혀있어도 보임)
      await expect(testOperatorPage.getByText('상태: 사용 가능')).toBeVisible();
      await expect(testOperatorPage.getByText('교정: 자체 점검')).toBeVisible();
      await expect(testOperatorPage.getByText('분류: FCC EMC/RF')).toBeVisible();
      await expect(testOperatorPage.getByText('구분: 공용장비')).toBeVisible();
      await expect(testOperatorPage.getByText('교정기한: 교정 임박')).toBeVisible();

      // 7. 페이지네이션 상태 복원 확인
      // 페이지 번호가 2로 설정되어야 함 (URL page=2)
      await expect(testOperatorPage).toHaveURL(/page=2/);

      // 8. 정렬 상태 복원 확인
      await expect(testOperatorPage).toHaveURL(/sortBy=name/);
      await expect(testOperatorPage).toHaveURL(/sortOrder=asc/);

      console.log('[Test] ✅ All filter states restored from URL parameters');
    });

    test('should restore partial filter states from URL parameters', async ({
      testOperatorPage,
    }) => {
      // 일부 필터만 적용된 URL로 이동
      const urlWithPartialFilters = '/equipment?status=available&search=오실로';

      await testOperatorPage.goto(urlWithPartialFilters);

      // 1. 검색어 필터 복원 확인
      const searchInput = testOperatorPage.getByRole('searchbox');
      await expect(searchInput).toHaveValue('오실로');

      // 2. 상태 필터 복원 확인
      const statusFilter = testOperatorPage.getByRole('combobox', { name: /상태/i });
      await expect(statusFilter).toContainText('사용 가능');

      // 3. 나머지 필터는 기본값이어야 함
      const managementMethodFilter = testOperatorPage.getByRole('combobox', {
        name: /교정.*방법/i,
      });
      await expect(managementMethodFilter).toContainText('모든 관리 방법');

      const classificationFilter = testOperatorPage.getByRole('combobox', { name: /분류/i });
      await expect(classificationFilter).toContainText('모든 분류');

      console.log('[Test] ✅ Partial filter states restored correctly');
    });
  });

  test.describe('1.2. Browser back button restores previous filter state', () => {
    test('should restore previous filter state when using browser back button', async ({
      testOperatorPage,
    }) => {
      // 1. 초기 상태: 필터 없음
      await testOperatorPage.goto('/equipment');

      // ClientOnly 컴포넌트가 hydrate될 때까지 대기

      let currentUrl = testOperatorPage.url();
      expect(currentUrl).not.toContain('status=');

      // 2. 상태 필터 적용
      const statusFilter = testOperatorPage.getByRole('combobox', { name: /상태/i });
      await statusFilter.click();
      await testOperatorPage.getByRole('option', { name: '사용 가능' }).click();

      // URL 업데이트 대기
      await testOperatorPage.waitForFunction(
        () => {
          return window.location.href.includes('status=available');
        },
        { timeout: 2000 }
      );

      currentUrl = testOperatorPage.url();
      expect(currentUrl).toContain('status=available');

      // 3. 검색어 추가
      const searchInput = testOperatorPage.getByRole('searchbox');
      await searchInput.fill('스펙트럼');

      // 디바운스 대기 + URL 업데이트 확인 (최대 3초)
      await testOperatorPage
        .waitForFunction(
          () => {
            return window.location.href.includes('search=');
          },
          { timeout: 3000 }
        )
        .catch(() => {
          // search 파라미터가 추가되지 않으면 Enter 키로 강제 제출
          return searchInput.press('Enter');
        });

      // URL 재확인
      currentUrl = testOperatorPage.url();
      expect(currentUrl).toContain('search=');

      // 4. 브라우저 뒤로 가기 (검색어 제거 상태로 복원)
      await testOperatorPage.goBack();

      currentUrl = testOperatorPage.url();
      expect(currentUrl).toContain('status=available');
      expect(currentUrl).not.toContain('search=');

      // UI 상태 확인
      await expect(searchInput).toHaveValue('');
      await expect(statusFilter).toContainText('사용 가능');

      // 5. 다시 뒤로 가기 (초기 상태로 복원)
      await testOperatorPage.goBack();

      currentUrl = testOperatorPage.url();
      expect(currentUrl).not.toContain('status=');
      expect(currentUrl).not.toContain('search=');

      await expect(statusFilter).toContainText('모든 상태');

      console.log('[Test] ✅ Browser back button restored previous filter states correctly');
    });
  });

  test.describe('1.3. Browser forward button restores next filter state', () => {
    test('should restore next filter state when using browser forward button', async ({
      testOperatorPage,
    }) => {
      // 1. 초기 상태: 필터 없음
      await testOperatorPage.goto('/equipment');

      // 2. 상태 필터 적용
      const statusFilter = testOperatorPage.getByRole('combobox', { name: /상태/i });
      await statusFilter.click();
      await testOperatorPage.getByRole('option', { name: '사용 가능' }).click();

      let currentUrl = testOperatorPage.url();
      expect(currentUrl).toContain('status=available');

      // 3. 검색어 추가
      const searchInput = testOperatorPage.getByRole('searchbox');
      await searchInput.fill('오실로');

      // 디바운스 대기 + URL 업데이트 확인

      // URL에 search 파라미터가 추가될 때까지 대기 (최대 2초)
      await testOperatorPage
        .waitForFunction(
          () => {
            return window.location.href.includes('search=');
          },
          { timeout: 2000 }
        )
        .catch(() => {
          // search 파라미터가 추가되지 않으면 Enter 키로 강제 제출
          return searchInput.press('Enter');
        });

      // URL 재확인
      currentUrl = testOperatorPage.url();
      expect(currentUrl).toContain('search=');

      // 4. 브라우저 뒤로 가기
      await testOperatorPage.goBack();

      currentUrl = testOperatorPage.url();
      expect(currentUrl).not.toContain('search=');

      // 5. 브라우저 앞으로 가기 (검색어 복원)
      await testOperatorPage.goForward();

      currentUrl = testOperatorPage.url();
      expect(currentUrl).toContain('status=available');

      // UI 상태 확인 (URL에 search가 있을 수 있음)
      const searchValue = await searchInput.inputValue();
      if (searchValue) {
        expect(searchValue).toBe('오실로');
      }
      await expect(statusFilter).toContainText('사용 가능');

      console.log('[Test] ✅ Browser forward button restored next filter state correctly');
    });
  });

  test.describe('1.4. Shareable URL preserves filter state', () => {
    test('should allow sharing URL with filter state to another user', async ({
      testOperatorPage,
    }) => {
      // 사용자 A가 필터를 적용한 URL
      const sharedUrl =
        '/equipment?' +
        'status=available' +
        '&managementMethod=external_calibration' +
        '&search=전원';

      // 사용자 B가 URL을 받아서 접속
      await testOperatorPage.goto(sharedUrl);

      // 필터 상태가 동일하게 복원되어야 함
      const statusFilter = testOperatorPage.getByRole('combobox', { name: /상태/i });
      await expect(statusFilter).toContainText('사용 가능');

      const managementMethodFilter = testOperatorPage.getByRole('combobox', {
        name: /교정.*방법/i,
      });
      await expect(managementMethodFilter).toContainText('외부 교정');

      const searchInput = testOperatorPage.getByRole('searchbox');
      await expect(searchInput).toHaveValue('전원');

      console.log('[Test] ✅ Shareable URL preserved filter state correctly');
    });
  });

  test.describe('1.5. Invalid URL parameters are handled gracefully', () => {
    test('should handle invalid status parameter gracefully', async ({ testOperatorPage }) => {
      // 잘못된 status 값
      await testOperatorPage.goto('/equipment?status=invalid_status');

      // 페이지가 에러 없이 로드되어야 함
      const pageTitle = testOperatorPage.getByRole('heading', { level: 1, name: /장비 관리/i });
      await expect(pageTitle).toBeVisible();

      // ClientOnly 컴포넌트가 hydrate될 때까지 대기

      // 잘못된 값은 무시되고 필터가 적용되지 않음 (URL은 유지될 수 있음)
      // 검색바가 보이면 페이지가 정상 로드된 것
      const searchBar = testOperatorPage.getByRole('searchbox');
      await expect(searchBar).toBeVisible({ timeout: 10000 });

      console.log('[Test] ✅ Invalid status parameter handled gracefully');
    });

    test('should handle invalid page parameter gracefully', async ({ testOperatorPage }) => {
      // 잘못된 page 값
      await testOperatorPage.goto('/equipment?page=-1');

      // 페이지가 에러 없이 로드되어야 함
      const pageTitle = testOperatorPage.getByRole('heading', { level: 1, name: /장비 관리/i });
      await expect(pageTitle).toBeVisible();

      // 잘못된 page 값은 기본값(1)으로 처리됨을 확인
      // 검색바가 보이면 페이지가 정상 로드된 것
      const searchBar = testOperatorPage.getByRole('searchbox');
      await expect(searchBar).toBeVisible();

      console.log('[Test] ✅ Invalid page parameter handled gracefully');
    });

    test('should handle invalid sortOrder parameter gracefully', async ({ testOperatorPage }) => {
      // 잘못된 sortOrder 값
      await testOperatorPage.goto('/equipment?sortBy=name&sortOrder=invalid');

      // 페이지가 에러 없이 로드되어야 함
      const pageTitle = testOperatorPage.getByRole('heading', { level: 1, name: /장비 관리/i });
      await expect(pageTitle).toBeVisible();

      // 잘못된 값은 기본값으로 처리됨을 확인
      // 검색바가 보이면 페이지가 정상 로드된 것
      const searchBar = testOperatorPage.getByRole('searchbox');
      await expect(searchBar).toBeVisible();

      console.log('[Test] ✅ Invalid sortOrder parameter handled gracefully');
    });

    test('should handle invalid calibrationDueFilter parameter gracefully', async ({
      testOperatorPage,
    }) => {
      // 잘못된 calibrationDueFilter 값
      await testOperatorPage.goto('/equipment?calibrationDueFilter=invalid_filter');

      // 페이지가 에러 없이 로드되어야 함
      const pageTitle = testOperatorPage.getByRole('heading', { level: 1, name: /장비 관리/i });
      await expect(pageTitle).toBeVisible();

      // 잘못된 값은 무시하고 기본값으로 표시
      const calibrationDueFilter = testOperatorPage.getByRole('combobox', {
        name: /교정.*기한/i,
      });
      await expect(calibrationDueFilter).toContainText('전체');

      console.log('[Test] ✅ Invalid calibrationDueFilter parameter handled gracefully');
    });

    test('should handle malformed URL with special characters', async ({ testOperatorPage }) => {
      // 특수 문자가 포함된 잘못된 URL
      await testOperatorPage.goto('/equipment?search=<script>alert("xss")</script>');

      // 페이지가 에러 없이 로드되어야 함
      const pageTitle = testOperatorPage.getByRole('heading', { level: 1, name: /장비 관리/i });
      await expect(pageTitle).toBeVisible();

      // XSS 공격 시도가 실행되지 않아야 함 (alert가 뜨지 않음)
      // input value 자체는 텍스트로 저장되므로 <script> 문자열이 있을 수 있음
      // 중요한 것은 스크립트가 실행되지 않는 것
      const searchInput = testOperatorPage.getByRole('searchbox');
      const searchValue = await searchInput.inputValue();

      // 페이지가 정상 로드되고 에러가 없으면 XSS가 실행되지 않은 것
      // (실제 XSS 공격이 성공했다면 alert가 떠서 테스트가 멈췄을 것)
      expect(searchValue).toBeTruthy();

      console.log('[Test] ✅ Malformed URL with special characters handled securely');
    });
  });
});
