/**
 * Group F: Loading States Tests
 *
 * 로딩 상태 UI 테스트 (3개)
 * - 초기 로딩 시 스켈레톤 표시
 * - 필터 변경 시 로딩 인디케이터
 * - 검색 시 스피너 표시
 *
 * Auth: testOperatorPage (시험실무자)
 *
 * Note: F-7 marked as fixme due to SSR architecture
 * F-8 and F-9 test client-side state changes
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { EquipmentStatusValues as ESVal } from '@equipment-management/schemas';

test.describe('Group F: Loading States', () => {
  /**
   * F-7: 초기 로딩 시 스켈레톤 표시
   * - 페이지 첫 로드 시
   * - 스켈레톤 컴포넌트가 표시되어야 함
   * - aria-busy='true' 속성 확인
   *
   * FIXME: Test requires delaying SSR data fetch
   * Current architecture: SSR provides initialData, skeleton only shows if no initialData
   */
  test.fixme(
    'F-7: should display skeleton loading state on initial page load',
    async ({ testOperatorPage }) => {
      // This test would require:
      // 1. Slow backend API response, OR
      // 2. Network throttling during SSR, OR
      // 3. Loading page without initialData prop

      await testOperatorPage.goto('/equipment');

      // Skeleton loading state
      const skeletonContainer = testOperatorPage.locator('[aria-busy="true"]');
      await expect(skeletonContainer).toBeVisible();

      // Skeleton animation
      const skeletonElement = testOperatorPage.locator('.animate-pulse').first();
      await expect(skeletonElement).toBeVisible();

      // Wait for loading to complete

      // Data is displayed
      const contentContainer = testOperatorPage.locator('[aria-live="polite"]').first();
      await expect(contentContainer).toHaveAttribute('aria-busy', 'false');

      const equipmentTable = testOperatorPage.locator('table, [role="grid"]');
      await expect(equipmentTable).toBeVisible();
    }
  );

  /**
   * F-8: 필터 변경 시 로딩 인디케이터
   * - 필터 선택 후
   * - aria-busy 속성이 true로 변경되어야 함
   * - 데이터 로드 후 false로 변경
   *
   * FIXME: Page crashes during navigation - needs proper test environment setup
   */
  test.fixme(
    'F-8: should display loading indicator when filters change',
    async ({ testOperatorPage }) => {
      // 초기 데이터 응답
      let requestCount = 0;

      await testOperatorPage.route('**/api/equipment*', async (route) => {
        requestCount++;

        if (requestCount === 1) {
          // 첫 번째 요청: 전체 장비
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: [
                {
                  id: 'equipment-1',
                  name: '장비 1',
                  managementNumber: 'SUW-E0001',
                  status: ESVal.AVAILABLE,
                  site: 'SUW',
                  classification: 'E',
                  team: { id: 'team-1', name: '팀 A' },
                },
                {
                  id: 'equipment-2',
                  name: '장비 2',
                  managementNumber: 'SUW-E0002',
                  status: ESVal.SPARE,
                  site: 'SUW',
                  classification: 'E',
                  team: { id: 'team-1', name: '팀 A' },
                },
              ],
              meta: {
                pagination: {
                  total: 2,
                  totalPages: 1,
                  currentPage: 1,
                  pageSize: 20,
                },
              },
            }),
          });
        } else {
          // 두 번째 요청: 필터링된 장비 (1초 지연)
          await new Promise((resolve) => setTimeout(resolve, 1000));
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: [
                {
                  id: 'equipment-1',
                  name: '장비 1',
                  managementNumber: 'SUW-E0001',
                  status: ESVal.AVAILABLE,
                  site: 'SUW',
                  classification: 'E',
                  team: { id: 'team-1', name: '팀 A' },
                },
              ],
              meta: {
                pagination: {
                  total: 1,
                  totalPages: 1,
                  currentPage: 1,
                  pageSize: 20,
                },
              },
            }),
          });
        }
      });

      // 장비 목록 페이지로 이동
      await testOperatorPage.goto('/equipment');

      // 초기 데이터 확인
      await expect(testOperatorPage.getByText('장비 1').first()).toBeVisible();
      await expect(testOperatorPage.getByText('장비 2').first()).toBeVisible();

      // 필터 패널 열기
      const filterTrigger = testOperatorPage.getByRole('button', { name: /필터/ });
      await filterTrigger.click();

      // 상태 필터 선택 (사용 가능)
      const statusFilter = testOperatorPage
        .locator('button[role="combobox"]')
        .filter({ hasText: '전체 상태' });
      await statusFilter.click();
      const availableOption = testOperatorPage.getByRole('option', { name: '사용 가능' });
      await availableOption.click();

      // 로딩 인디케이터 확인 (aria-busy='true')
      const contentContainer = testOperatorPage.locator('[aria-live="polite"]').first();
      await expect(contentContainer).toHaveAttribute('aria-busy', 'true');

      // 로딩 완료 대기

      // aria-busy가 false로 변경되는지 확인
      await expect(contentContainer).toHaveAttribute('aria-busy', 'false');

      // 필터링된 데이터 확인 (장비 1만 표시)
      await expect(testOperatorPage.getByText('장비 1').first()).toBeVisible();
      await expect(testOperatorPage.getByText('장비 2')).toBeHidden();
    }
  );

  /**
   * F-9: 검색 시 스피너 표시
   * - 검색어 입력 후 Enter 시
   * - 로딩 스피너(Loader2 아이콘)가 표시되어야 함
   * - 검색 완료 후 스피너 사라짐
   *
   * FIXME: Page crashes during navigation - needs proper test environment setup
   */
  test.fixme('F-9: should display loading spinner during search', async ({ testOperatorPage }) => {
    let requestCount = 0;

    await testOperatorPage.route('**/api/equipment*', async (route) => {
      requestCount++;

      if (requestCount === 1) {
        // 첫 번째 요청: 초기 데이터
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                id: 'equipment-1',
                name: '멀티미터',
                managementNumber: 'SUW-E0001',
                status: ESVal.AVAILABLE,
                site: 'SUW',
                classification: 'E',
                team: { id: 'team-1', name: '팀 A' },
              },
              {
                id: 'equipment-2',
                name: '오실로스코프',
                managementNumber: 'SUW-E0002',
                status: ESVal.AVAILABLE,
                site: 'SUW',
                classification: 'E',
                team: { id: 'team-1', name: '팀 A' },
              },
            ],
            meta: {
              pagination: {
                total: 2,
                totalPages: 1,
                currentPage: 1,
                pageSize: 20,
              },
            },
          }),
        });
      } else {
        // 두 번째 요청: 검색 결과 (1초 지연)
        await new Promise((resolve) => setTimeout(resolve, 1000));
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                id: 'equipment-1',
                name: '멀티미터',
                managementNumber: 'SUW-E0001',
                status: ESVal.AVAILABLE,
                site: 'SUW',
                classification: 'E',
                team: { id: 'team-1', name: '팀 A' },
              },
            ],
            meta: {
              pagination: {
                total: 1,
                totalPages: 1,
                currentPage: 1,
                pageSize: 20,
              },
            },
          }),
        });
      }
    });

    // 장비 목록 페이지로 이동
    await testOperatorPage.goto('/equipment');

    // 초기 데이터 확인 - 테이블의 첫 번째 장비명만 확인 (strict mode 회피)
    const multimeterRow = testOperatorPage.locator('tr').filter({ hasText: '멀티미터' }).first();
    await expect(multimeterRow).toBeVisible();
    const oscilloscopeRow = testOperatorPage
      .locator('tr')
      .filter({ hasText: '오실로스코프' })
      .first();
    await expect(oscilloscopeRow).toBeVisible();

    // 검색바에 검색어 입력
    const searchInput = testOperatorPage.getByPlaceholder('장비명, 관리번호, 모델명으로 검색...');
    await searchInput.fill('멀티미터');
    await searchInput.press('Enter');

    // 로딩 스피너 확인 (Loader2 아이콘 - lucide-loader-2 또는 animate-spin)
    const spinner = testOperatorPage.locator('.lucide-loader-2, .animate-spin').first();
    await expect(spinner).toBeVisible();

    // 로딩 완료 대기

    // 스피너가 사라지는지 확인
    await expect(spinner).toBeHidden();

    // 검색 결과 확인 (멀티미터만 표시, 오실로스코프 없음)
    await expect(multimeterRow).toBeVisible();
    await expect(oscilloscopeRow).toBeHidden();
  });
});
