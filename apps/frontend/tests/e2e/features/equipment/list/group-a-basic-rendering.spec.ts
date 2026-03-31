/**
 * Group A: 기본 UI 렌더링 테스트
 *
 * 검증 범위:
 * 1. 페이지 헤더 요소 표시 확인
 * 2. 필터 패널 표시 확인
 * 3. 검색바 및 뷰 컨트롤 표시 확인
 * 4. 장비 테이블 표시 확인
 * 5. 페이지네이션 컨트롤 표시 확인
 *
 * SSOT:
 * - EQUIPMENT_STATUS_FILTER_OPTIONS: @equipment-management/schemas
 * - SITE_OPTIONS: EquipmentFilters.tsx (프론트엔드 UI 전용)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('Group A: Basic UI Rendering', () => {
  test.describe('1.1. Page header elements are displayed correctly', () => {
    test('should display page header with title, subtitle, and action buttons', async ({
      testOperatorPage,
    }) => {
      await testOperatorPage.goto('/equipment');

      // 1. 페이지 타이틀 확인
      const pageTitle = testOperatorPage.getByRole('heading', { level: 1, name: /장비 관리/i });
      await expect(pageTitle).toBeVisible();

      // 2. 서브타이틀 확인
      const subtitle = testOperatorPage.getByText(/장비 등록, 수정, 교정 이력 관리/i);
      await expect(subtitle).toBeVisible();

      // 3. 장비 등록 버튼 확인
      const createButton = testOperatorPage.getByRole('link', { name: '장비 등록', exact: true });
      await expect(createButton).toBeVisible();

      console.log('[Test] ✅ Page header elements displayed correctly');
    });
  });

  test.describe('1.2. Filter panel is displayed with all filter options', () => {
    test('should display filter panel with all filter options for lab_manager', async ({
      siteAdminPage,
    }) => {
      await siteAdminPage.goto('/equipment');

      // 필터 패널 확인 (group role 사용)
      const filterGroup = siteAdminPage.getByRole('group', { name: '장비 필터 옵션' });
      await expect(filterGroup).toBeVisible();

      // 1. 사이트 필터 (1차 필터 - 항상 표시)
      const siteFilter = siteAdminPage.getByRole('combobox', { name: '사이트 필터 선택' });
      await expect(siteFilter).toBeVisible();

      // 2. 상태 필터 (1차 필터 - 항상 표시)
      const statusFilter = siteAdminPage.getByRole('combobox', { name: '장비 상태 필터 선택' });
      await expect(statusFilter).toBeVisible();

      // 3. 교정 기한 필터 (1차 필터 - 항상 표시)
      const calibrationDueFilter = siteAdminPage.getByRole('combobox', {
        name: '교정 기한 필터 선택',
      });
      await expect(calibrationDueFilter).toBeVisible();

      // 4. 추가 필터 버튼 클릭 후 2차 필터 확인
      await siteAdminPage.getByRole('button', { name: /추가 필터/ }).click();

      // 5. 교정 방법 필터 (2차 필터)
      const calibrationMethodFilter = siteAdminPage.getByRole('combobox', {
        name: '교정 방법 필터 선택',
      });
      await expect(calibrationMethodFilter).toBeVisible();

      // 6. 분류 필터 (2차 필터)
      const classificationFilter = siteAdminPage.getByRole('combobox', {
        name: '장비 분류 필터 선택',
      });
      await expect(classificationFilter).toBeVisible();

      // 7. 장비 구분 필터 (2차 필터)
      const sharedFilter = siteAdminPage.getByRole('combobox', { name: '장비 구분 필터 선택' });
      await expect(sharedFilter).toBeVisible();

      // 8. 팀 필터 (2차 필터)
      const teamFilter = siteAdminPage.getByRole('combobox', { name: '팀 필터 선택' });
      await expect(teamFilter).toBeVisible();

      console.log('[Test] ✅ All filter options displayed for lab_manager');
    });
  });

  test.describe('1.3. Search bar and view controls are displayed', () => {
    test('should display search bar with correct placeholder and view toggle buttons', async ({
      testOperatorPage,
    }) => {
      await testOperatorPage.goto('/equipment');

      // 1. 검색바 확인 (type="text"이므로 aria-label로 찾기)
      const searchInput = testOperatorPage.getByRole('textbox', {
        name: '장비명, 모델명, 관리번호 검색',
      });
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toHaveAttribute('placeholder', /장비명, 모델명, 관리번호로 검색/i);

      // 2. 검색 컨테이너 role 확인
      const searchRegion = testOperatorPage.getByRole('search', { name: '장비 검색' });
      await expect(searchRegion).toBeVisible();

      // 3. 뷰 토글 버튼 확인
      const tableViewButton = testOperatorPage.getByRole('radio', { name: /테이블 뷰/i });
      const cardViewButton = testOperatorPage.getByRole('radio', { name: /카드 뷰/i });

      await expect(tableViewButton).toBeVisible();
      await expect(cardViewButton).toBeVisible();

      // 4. 기본값으로 테이블 뷰가 선택되어 있어야 함
      await expect(tableViewButton).toBeChecked();

      console.log('[Test] ✅ Search bar and view controls displayed');
    });
  });

  test.describe('1.4. Equipment table is displayed with correct columns', () => {
    test('should display equipment table with all column headers', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      // 테이블이 로딩될 때까지 대기
      const table = testOperatorPage.getByRole('grid', { name: /장비 목록/i });
      await expect(table).toBeVisible({ timeout: 10000 });

      // 2. 컬럼 헤더 확인 (모델명 컬럼 없음 — 관리번호, 장비명, 위치, 교정 기한, 상태, 상세)
      const columnHeaders = [/관리번호/i, /장비명/i, /상태/i, /교정.*기한/i, /위치/i, /상세/i];

      for (const headerPattern of columnHeaders) {
        const header = testOperatorPage.getByRole('columnheader', { name: headerPattern });
        await expect(header).toBeVisible();
      }

      // 3. 정렬 가능한 컬럼에 정렬 버튼 확인
      const sortableColumns = [/장비명.*정렬/i, /관리번호.*정렬/i];

      for (const buttonPattern of sortableColumns) {
        const sortButton = testOperatorPage.getByRole('button', { name: buttonPattern });
        await expect(sortButton).toBeVisible();
      }

      // 4. 장비 행 확인
      const equipmentRows = testOperatorPage.locator('[data-testid="equipment-row"]');
      const rowCount = await equipmentRows.count();
      expect(rowCount).toBeGreaterThan(0);

      console.log('[Test] ✅ Equipment table displayed with correct columns');
    });
  });

  test.describe('1.5. Pagination controls are displayed', () => {
    test('should display pagination controls with all navigation elements', async ({
      testOperatorPage,
    }) => {
      await testOperatorPage.goto('/equipment');

      // 페이지네이션이 로딩될 때까지 대기
      const pagination = testOperatorPage.getByRole('navigation', { name: /페이지.*탐색/i });
      await expect(pagination).toBeVisible({ timeout: 10000 });

      // 2. 총 아이템 수 표시 확인 (숫자는 동적이므로 패턴 매칭)
      const totalText = pagination.getByText(/총.*\d+.*개/i);
      await expect(totalText).toBeVisible();

      // 3. 페이지당 항목 수 표시 확인 (페이지 크기 셀렉터가 있는지 확인)
      const pageSizeText = pagination.getByText('페이지당');
      await expect(pageSizeText).toBeVisible();

      // 4. 페이지 네비게이션 버튼 확인 (버튼 역할로 확인)
      const firstPageButton = pagination.getByRole('button', { name: /첫.*페이지/i });
      const prevPageButton = pagination.getByRole('button', { name: /이전.*페이지/i });
      const nextPageButton = pagination.getByRole('button', { name: /다음.*페이지/i });
      const lastPageButton = pagination.getByRole('button', { name: /마지막.*페이지/i });

      await expect(firstPageButton).toBeVisible();
      await expect(prevPageButton).toBeVisible();
      await expect(nextPageButton).toBeVisible();
      await expect(lastPageButton).toBeVisible();

      // 5. 페이지 번호 그룹 확인
      const pageNumberGroup = pagination.getByRole('group', { name: /페이지.*번호/i });
      await expect(pageNumberGroup).toBeVisible();

      console.log('[Test] ✅ Pagination controls displayed correctly');
    });
  });
});
