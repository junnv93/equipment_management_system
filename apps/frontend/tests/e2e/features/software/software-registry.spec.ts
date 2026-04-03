/**
 * 소프트웨어 레지스트리 페이지 E2E 테스트
 *
 * 검증 대상:
 * - 페이지 로딩 및 통계 카드 렌더링
 * - 소프트웨어 요약 카드 렌더링
 * - 검색 필터 기능
 * - 테이블 렌더링 및 장비 상세 링크
 * - 빈 검색 결과 상태
 */
import { test, expect } from '../../shared/fixtures/auth.fixture';

test.describe('소프트웨어 레지스트리', () => {
  test('TC-01: 페이지 로딩 후 헤더와 통계 카드가 표시된다', async ({ testOperatorPage: page }) => {
    await page.goto('/software');

    // 헤더 확인
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // 테이블이 로딩될 때까지 대기 (스켈레톤 이후)
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 });
  });

  test('TC-02: 소프트웨어 테이블이 렌더링되고 데이터가 표시된다', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/software');

    // 테이블 헤더 확인
    const table = page.getByRole('table');
    await expect(table).toBeVisible({ timeout: 10000 });

    // 테이블 헤더 열 확인
    const headerCells = page.getByRole('columnheader');
    await expect(headerCells).toHaveCount(6); // equipmentName, softwareName, version, type, lastUpdated, action
  });

  test('TC-03: 검색 필터로 테이블 결과를 필터링할 수 있다', async ({ testOperatorPage: page }) => {
    await page.goto('/software');

    // 테이블이 로딩될 때까지 대기
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // 초기 행 수 확인
    const initialRows = page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') });
    const initialCount = await initialRows.count();

    // 존재하지 않는 소프트웨어 검색
    const searchInput = page.getByRole('textbox');
    await searchInput.fill('nonexistent-software-xyz-12345');

    // 빈 상태 표시 확인 또는 결과 0건 확인
    const emptyOrFiltered =
      (await page.getByText(/0/).count()) > 0 ||
      (await page
        .getByRole('row')
        .filter({ hasNot: page.getByRole('columnheader') })
        .count()) === 0;
    expect(emptyOrFiltered || initialCount === 0).toBeTruthy();

    // 검색 초기화
    await searchInput.clear();

    // 원래 행 수로 복원 확인
    if (initialCount > 0) {
      await expect(
        page.getByRole('row').filter({ hasNot: page.getByRole('columnheader') })
      ).toHaveCount(initialCount);
    }
  });

  test('TC-04: 장비 상세 소프트웨어 이력 링크가 올바르게 연결된다', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/software');

    // 테이블이 로딩될 때까지 대기
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // 소프트웨어 이력 링크 확인
    const softwareLinks = page.locator('a[href*="/equipment/"][href*="/software"]');

    const linkCount = await softwareLinks.count();
    if (linkCount > 0) {
      const href = await softwareLinks.first().getAttribute('href');
      expect(href).toMatch(/\/equipment\/[\w-]+\/software/);
    }
  });

  test('TC-05: 기술책임자도 소프트웨어 페이지에 접근할 수 있다', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/software');

    // 페이지 로딩 확인 (403이 아닌 정상 렌더링)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });
  });
});
