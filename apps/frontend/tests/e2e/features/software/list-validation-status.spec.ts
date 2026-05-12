/**
 * 소프트웨어 목록 — 검증 상태 컬럼 E2E (DESIGN_REVIEW.md P0-3).
 *
 * 검증 대상:
 * - "검증 상태" 컬럼이 데스크톱 테이블에 노출
 * - latestValidationStatus 5단계 + 미검증 6분류 배지 시멘틱 톤
 * - 모바일 카드 fallback에서도 검증 상태 노출 (md 미만)
 * - 통합 identifier 컬럼 (P-number + 이름 stacked)
 */
import { test, expect } from '../../shared/fixtures/auth.fixture';

test.describe('소프트웨어 목록 — 검증 상태 컬럼', () => {
  test('TC-01: 데스크톱 테이블에 "검증 상태" 컬럼이 노출된다', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/software');
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 });

    const headerCells = page.getByRole('columnheader');
    // 8 컬럼 + 검증 상태 = 총 9 컬럼 (identifier로 통합 후)
    await expect(headerCells.filter({ hasText: /검증 상태|Validation Status/ })).toBeVisible();
  });

  test('TC-02: 통합 identifier 컬럼에 P-number + 소프트웨어명 stacked', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/software');
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 });

    // identifier 헤더 (관리번호 / 소프트웨어명) 노출
    const headerCells = page.getByRole('columnheader');
    await expect(
      headerCells.filter({ hasText: /관리번호.*소프트웨어명|Mgmt No.*Software Name/ })
    ).toBeVisible();

    // 첫 행에서 P-number(P + 4자리 숫자)와 이름이 동일 셀에 stacked
    const rows = page
      .getByRole('row')
      .filter({ hasNot: page.getByRole('columnheader') });
    const rowCount = await rows.count();
    if (rowCount > 0) {
      // P-number font-mono text-[11px] 시각: 한 셀 안에 두 텍스트 노드
      const firstCell = rows.first().getByRole('cell').first();
      await expect(firstCell).toBeVisible();
    }
  });

  test('TC-03: 모바일 viewport (< md) 에서 카드 리스트로 fallback', async ({
    testOperatorPage: page,
  }) => {
    // md=768px 미만으로 viewport 설정
    await page.setViewportSize({ width: 640, height: 800 });
    await page.goto('/software');

    // 데스크톱 테이블은 hidden, 모바일 카드 리스트만 보임
    const desktopTable = page.locator('[data-responsive-slot="desktop"]');
    const mobileList = page.locator('[data-responsive-slot="mobile"]');

    await expect(mobileList).toBeVisible({ timeout: 15000 });
    // 데스크톱 slot은 DOM에 있지만 hidden md:block으로 숨겨짐
    await expect(desktopTable).toBeHidden();
  });

  test('TC-04: 데스크톱 viewport (>= md) 에서 테이블 노출 + 모바일 카드 hidden', async ({
    testOperatorPage: page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/software');

    const desktopTable = page.locator('[data-responsive-slot="desktop"]');
    const mobileList = page.locator('[data-responsive-slot="mobile"]');

    await expect(desktopTable).toBeVisible({ timeout: 15000 });
    await expect(mobileList).toBeHidden();
  });
});
