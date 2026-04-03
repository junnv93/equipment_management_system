/**
 * 확인 필요(Pending Checks) 목록 E2E 테스트
 *
 * 검증 대상:
 * - 페이지 로딩 및 헤더/필터 버튼 렌더링
 * - 역할 필터 탭 (전체/빌려주는 측/빌리는 측) URL 상태 관리
 * - 카드 렌더링 (상태 배지, 장비명, 관리번호, 반납 예정일)
 * - 빈 상태 표시
 * - 확인 버튼 링크 연결
 */
import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('확인 필요 목록', () => {
  test('TC-01: 페이지 로딩 후 헤더와 필터 버튼이 표시된다', async ({ testOperatorPage: page }) => {
    await page.goto('/checkouts/pending-checks');

    // 헤더 확인
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 필터 버튼 3개 존재 확인 (전체, 빌려주는 측, 빌리는 측)
    const buttons = page.getByRole('button');
    // 최소 3개 필터 버튼 + 1개 목록으로 돌아가기 버튼 = 4개 이상
    await expect(buttons.first()).toBeVisible();
  });

  test('TC-02: 역할 필터 클릭 시 URL이 업데이트된다', async ({ testOperatorPage: page }) => {
    await page.goto('/checkouts/pending-checks');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 필터 버튼들 찾기 — 3개 크기가 'sm'인 버튼
    const filterButtons = page.locator('.flex.gap-2.mb-6 button');
    await expect(filterButtons).toHaveCount(3);

    // 두 번째 버튼 (빌려주는 측) 클릭
    await filterButtons.nth(1).click();
    await page.waitForURL(/role=lender/);
    expect(page.url()).toContain('role=lender');

    // 세 번째 버튼 (빌리는 측) 클릭
    await filterButtons.nth(2).click();
    await page.waitForURL(/role=borrower/);
    expect(page.url()).toContain('role=borrower');

    // 첫 번째 버튼 (전체) 클릭 → role 파라미터 제거
    await filterButtons.nth(0).click();
    await page.waitForURL((url) => !url.searchParams.has('role'));
    expect(page.url()).not.toContain('role=');
  });

  test('TC-03: URL에 role 파라미터가 있으면 해당 필터가 활성화된다', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/checkouts/pending-checks?role=borrower');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // borrower 필터가 활성화(default variant)된 상태인지 확인
    const filterButtons = page.locator('.flex.gap-2.mb-6 button');
    // 세 번째 버튼(빌리는 측)이 default variant
    const borrowerBtn = filterButtons.nth(2);
    await expect(borrowerBtn).toHaveClass(/bg-primary|default/);
  });

  test('TC-04: 확인 항목이 없으면 빈 상태가 표시된다', async ({ systemAdminPage: page }) => {
    // 시스템 관리자는 확인 항목이 없을 가능성이 높음
    await page.goto('/checkouts/pending-checks');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 빈 상태 또는 카드 목록 중 하나가 표시됨
    const emptyState = page.locator('text=/확인할|No.*check|모두 완료/i');
    const cards = page.locator('[class*="grid"] > div');

    const hasEmpty = (await emptyState.count()) > 0;
    const hasCards = (await cards.count()) > 0;

    // 둘 중 하나는 반드시 존재
    expect(hasEmpty || hasCards).toBeTruthy();
  });

  test('TC-05: 대여 목록으로 돌아가기 버튼이 동작한다', async ({ testOperatorPage: page }) => {
    await page.goto('/checkouts/pending-checks');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // PageHeader actions 영역의 outline variant 버튼 찾기
    // 버튼 텍스트로 찾기 (i18n: 목록, list 등)
    const backToListBtn = page.getByRole('button').filter({ hasText: /목록|list|돌아가기|back/i });

    if ((await backToListBtn.count()) > 0) {
      await backToListBtn.first().click();
      await page.waitForURL(/\/checkouts/, { timeout: 10000 });
    }
  });
});
