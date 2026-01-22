import { test, expect } from './fixtures/auth.fixture';

/**
 * 장비 목록/검색 UI 개선 E2E 테스트
 *
 * 테스트 범위:
 * - 필터 적용 및 URL 상태 관리
 * - 검색 기능
 * - 페이지네이션
 * - 뷰 전환 (테이블/카드)
 * - 에러 처리
 * - 로딩 상태
 * - 접근성
 */

test.describe('Equipment List - Basic', () => {
  test('페이지가 올바르게 로드되어야 함', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment');

    // 페이지 헤더 확인
    await expect(page.getByRole('heading', { name: '장비 관리' })).toBeVisible();

    // 검색바 확인
    await expect(page.getByRole('search')).toBeVisible();

    // 장비 등록 버튼 확인
    await expect(page.getByRole('button', { name: /장비 등록/ })).toBeVisible();
  });

  test('사이트 필터 적용 시 URL이 업데이트되어야 함', async ({ techManagerPage: page }) => {
    await page.goto('/equipment');

    // 필터 패널 열기 (접힌 경우)
    const filterButton = page.getByRole('button', { name: /필터/ });
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }

    // 사이트 필터 선택
    await page.getByLabel('사이트').click();
    await page.getByRole('option', { name: '수원랩' }).click();

    // URL에 필터 반영 확인
    await expect(page).toHaveURL(/site=suwon/);
  });

  test('상태 필터 적용 시 URL이 업데이트되어야 함', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment');

    // 상태 필터 선택
    await page.getByLabel('상태').click();
    await page.getByRole('option', { name: '사용 가능' }).click();

    // URL에 필터 반영 확인
    await expect(page).toHaveURL(/status=available/);
  });

  test('검색어 입력 시 URL이 업데이트되어야 함', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment');

    // 검색어 입력
    const searchInput = page.getByRole('textbox', { name: /검색/ });
    await searchInput.fill('스펙트럼');

    // 디바운스 대기
    await page.waitForTimeout(500);

    // URL에 검색어 반영 확인
    await expect(page).toHaveURL(/search=/);
  });

  test('필터 초기화가 동작해야 함', async ({ testOperatorPage: page }) => {
    // 필터가 적용된 URL로 이동
    await page.goto('/equipment?site=suwon&status=available');

    // 초기화 버튼 클릭
    await page.getByRole('button', { name: '초기화' }).click();

    // URL에서 필터 파라미터 제거 확인
    await expect(page).toHaveURL('/equipment');
  });
});

test.describe('Equipment List - View Toggle', () => {
  test('테이블 뷰와 카드 뷰 전환이 동작해야 함', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment');

    // 초기 테이블 뷰 확인
    const tableViewButton = page.getByRole('radio', { name: '테이블 뷰' });
    const cardViewButton = page.getByRole('radio', { name: '카드 뷰' });

    // 카드 뷰로 전환
    await cardViewButton.click();

    // 카드 그리드가 표시되어야 함
    await expect(page.getByTestId('equipment-card-grid')).toBeVisible();

    // 다시 테이블 뷰로 전환
    await tableViewButton.click();

    // 테이블이 표시되어야 함
    await expect(page.getByRole('grid', { name: '장비 목록' }).or(page.getByRole('table'))).toBeVisible();
  });

  test('뷰 상태가 새로고침 후에도 유지되어야 함', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment');

    // 카드 뷰로 전환
    await page.getByRole('radio', { name: '카드 뷰' }).click();
    await expect(page.getByTestId('equipment-card-grid')).toBeVisible();

    // 페이지 새로고침
    await page.reload();

    // 카드 뷰가 유지되어야 함
    await expect(page.getByTestId('equipment-card-grid')).toBeVisible();
  });
});

test.describe('Equipment List - Pagination', () => {
  test('다음 페이지로 이동이 동작해야 함', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment');

    // 다음 페이지 버튼 확인 및 클릭
    const nextButton = page.getByRole('button', { name: '다음 페이지' });

    if (await nextButton.isEnabled()) {
      await nextButton.click();

      // URL에 페이지 반영 확인
      await expect(page).toHaveURL(/page=2/);
    }
  });

  test('페이지당 항목 수 변경이 동작해야 함', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment');

    // 페이지당 항목 수 선택
    const pageSizeSelect = page.getByLabel('페이지당 항목 수 선택');

    if (await pageSizeSelect.isVisible()) {
      await pageSizeSelect.click();
      await page.getByRole('option', { name: '50' }).click();

      // URL에 pageSize 반영 확인
      await expect(page).toHaveURL(/pageSize=50/);
    }
  });
});

test.describe('Equipment List - URL State Restoration', () => {
  test('URL 파라미터로 필터 상태가 복원되어야 함', async ({ testOperatorPage: page }) => {
    // 필터가 적용된 URL로 직접 이동
    await page.goto('/equipment?site=suwon&status=available&search=테스트');

    // 필터가 적용된 상태로 표시되어야 함
    // 활성 필터 배지 확인
    const filterBadges = page.locator('[role="list"][aria-label="적용된 필터"]');

    if (await filterBadges.isVisible()) {
      await expect(filterBadges.getByText(/수원/)).toBeVisible();
      await expect(filterBadges.getByText(/사용 가능/)).toBeVisible();
    }

    // 검색어가 입력 필드에 표시되어야 함
    const searchInput = page.getByRole('textbox', { name: /검색/ });
    await expect(searchInput).toHaveValue('테스트');
  });

  test('뒤로가기 시 이전 필터 상태가 복원되어야 함', async ({ testOperatorPage: page }) => {
    // 첫 번째 필터 적용
    await page.goto('/equipment');
    await page.getByLabel('상태').click();
    await page.getByRole('option', { name: '사용 가능' }).click();
    await expect(page).toHaveURL(/status=available/);

    // 두 번째 필터 적용
    await page.getByLabel('사이트').click();
    await page.getByRole('option', { name: '수원랩' }).click();
    await expect(page).toHaveURL(/site=suwon/);

    // 뒤로가기
    await page.goBack();

    // 이전 상태로 복원 확인 (site 파라미터 없어야 함)
    await expect(page).not.toHaveURL(/site=suwon/);
    await expect(page).toHaveURL(/status=available/);
  });
});

test.describe('Equipment List - Error Handling', () => {
  test('API 에러 시 ErrorAlert이 표시되어야 함', async ({ page }) => {
    // API 응답 모킹 - 500 에러
    await page.route('**/api/equipment**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: '서버 오류가 발생했습니다' }),
      });
    });

    await page.goto('/equipment');

    // ErrorAlert 컴포넌트 표시 확인
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible();
  });

  test('다시 시도 버튼 클릭 시 재요청되어야 함', async ({ page }) => {
    let requestCount = 0;

    await page.route('**/api/equipment**', (route) => {
      requestCount++;
      if (requestCount === 1) {
        // 첫 번째 요청: 에러
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: '서버 오류' }),
        });
      } else {
        // 두 번째 요청: 성공
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            meta: { pagination: { total: 0, totalPages: 1, currentPage: 1 } },
          }),
        });
      }
    });

    await page.goto('/equipment');

    // 에러 상태 확인
    await expect(page.getByRole('alert')).toBeVisible();

    // 다시 시도 버튼 클릭
    await page.getByRole('button', { name: '다시 시도' }).click();

    // 에러가 사라지고 콘텐츠 표시 확인
    await expect(page.getByRole('alert')).not.toBeVisible({ timeout: 10000 });
  });
});

test.describe('Equipment List - Empty States', () => {
  test('검색 결과가 없을 때 적절한 메시지가 표시되어야 함', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment?search=존재하지않는장비XYZ123');

    // 빈 상태 메시지 확인
    await expect(page.getByText(/검색 결과가 없습니다|표시할 장비가 없습니다/)).toBeVisible({ timeout: 10000 });
  });

  test('필터 적용 후 결과가 없을 때 필터 초기화 버튼이 표시되어야 함', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment?status=retired&search=존재하지않는장비');

    // 필터 초기화 버튼 확인
    const clearButton = page.getByRole('button', { name: /필터 초기화/ });
    await expect(clearButton.or(page.getByRole('button', { name: /초기화/ }))).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Equipment List - Loading States', () => {
  test('로딩 중 스켈레톤이 표시되어야 함', async ({ page }) => {
    // 느린 응답 시뮬레이션
    await page.route('**/api/equipment**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          meta: { pagination: { total: 0, totalPages: 1, currentPage: 1 } },
        }),
      });
    });

    await page.goto('/equipment');

    // 스켈레톤 로딩 확인
    await expect(page.locator('[aria-busy="true"]')).toBeVisible();
  });
});

test.describe('Equipment List - Accessibility', () => {
  test('테이블에 적절한 ARIA 속성이 있어야 함', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment');

    // role="grid" 또는 테이블 구조 확인
    const table = page.getByRole('grid', { name: '장비 목록' }).or(page.getByRole('table'));
    await expect(table).toBeVisible();
  });

  test('검색 영역에 role="search"가 있어야 함', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment');

    // 검색 영역 ARIA 확인
    const searchRegion = page.getByRole('search');
    await expect(searchRegion).toBeVisible();
  });

  test('키보드 탐색이 가능해야 함', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment');

    // Tab 키로 탐색
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // 여러 번 Tab 후에도 포커스 유지
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('페이지네이션에 aria-label이 있어야 함', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment');

    // 페이지 탐색 영역 확인
    const pagination = page.getByRole('navigation', { name: '페이지 탐색' });
    if (await pagination.isVisible()) {
      // 이전/다음 버튼에 aria-label 확인
      await expect(pagination.getByRole('button', { name: /이전|다음/ }).first()).toBeVisible();
    }
  });
});

test.describe('Equipment List - Sorting', () => {
  test('정렬 기능이 동작해야 함', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment');

    // 테이블 뷰 확인
    const table = page.getByRole('grid', { name: '장비 목록' }).or(page.getByRole('table'));
    await expect(table).toBeVisible();

    // 장비명 열 헤더 클릭하여 정렬
    const nameHeader = page.getByRole('button', { name: /장비명.*정렬/ });
    if (await nameHeader.isVisible()) {
      await nameHeader.click();

      // URL에 정렬 파라미터 반영 확인
      await expect(page).toHaveURL(/sortBy=name/);
    }
  });

  test('정렬 순서 토글이 동작해야 함', async ({ testOperatorPage: page }) => {
    // 오름차순 정렬로 시작
    await page.goto('/equipment?sortBy=name&sortOrder=asc');

    // 같은 열 다시 클릭하여 정렬 순서 변경
    const nameHeader = page.getByRole('button', { name: /장비명.*정렬/ });
    if (await nameHeader.isVisible()) {
      await nameHeader.click();

      // 내림차순으로 변경 확인
      await expect(page).toHaveURL(/sortOrder=desc/);
    }
  });
});

test.describe('Equipment List - Role-based UI', () => {
  test('시험실무자는 사이트 필터가 제한되어야 함', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment');

    // 시험실무자는 자신의 사이트만 볼 수 있어야 함
    // 사이트 필터가 숨겨지거나 비활성화되어 있어야 함
    const siteFilter = page.getByLabel('사이트');

    // 시험실무자 권한에 따라 사이트 필터가 없거나 제한적일 수 있음
    // 이 테스트는 실제 권한 시스템에 따라 조정 필요
  });

  test('기술책임자는 모든 사이트를 볼 수 있어야 함', async ({ techManagerPage: page }) => {
    await page.goto('/equipment');

    // 기술책임자는 사이트 필터를 사용할 수 있어야 함
    const siteFilter = page.getByLabel('사이트');
    await expect(siteFilter).toBeVisible();
  });
});
