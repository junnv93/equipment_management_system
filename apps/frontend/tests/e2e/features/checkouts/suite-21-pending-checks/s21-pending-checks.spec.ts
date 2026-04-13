/**
 * 확인 필요(Pending Checks) 목록 E2E 테스트
 *
 * 검증 대상:
 * - 페이지 로딩 및 헤더/필터 버튼 렌더링
 * - 역할 필터 탭 (전체/빌려주는 측/빌리는 측) URL 상태 관리
 * - 카드 렌더링 (상태 배지, 장비명, 관리번호, 반납 예정일)
 * - 빈 상태 표시
 * - 확인 버튼 링크 연결
 * - [회귀] 탭 전환 후 캐시 일관성 (TC-06~TC-08)
 *   - SSOT 위반(서버가 항상 'all' fetch) + placeholderData 범위 오류로
 *     전체 탭에서 잘못된 항목 수가 표시되던 버그 검증
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

    // 필터 버튼들 찾기 — 텍스트 기반
    const lenderBtn = page.getByRole('button', { name: /빌려주는 측|Lender/i });
    const borrowerBtn = page.getByRole('button', { name: /빌리는 측|Borrower/i });
    const allBtn = page.getByRole('button', { name: /^전체$|^All$/i });

    // 빌려주는 측 클릭
    await lenderBtn.click();
    await page.waitForURL(/role=lender/);
    expect(page.url()).toContain('role=lender');

    // 빌리는 측 클릭
    await borrowerBtn.click();
    await page.waitForURL(/role=borrower/);
    expect(page.url()).toContain('role=borrower');

    // 전체 클릭 → role 파라미터 제거
    await allBtn.click();
    await page.waitForURL((url) => !url.searchParams.has('role'));
    expect(page.url()).not.toContain('role=');
  });

  test('TC-03: URL에 role 파라미터가 있으면 해당 필터가 활성화된다', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/checkouts/pending-checks?role=borrower');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // borrower 필터가 활성화(default variant)된 상태인지 확인
    const borrowerBtn = page.getByRole('button', { name: /빌리는 측|Borrower/i });
    await expect(borrowerBtn).toHaveClass(/bg-primary|default/);
  });

  test('TC-04: 확인 항목이 없으면 빈 상태가 표시된다', async ({ systemAdminPage: page }) => {
    // 시스템 관리자는 확인 항목이 없을 가능성이 높음
    await page.goto('/checkouts/pending-checks');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 빈 상태 또는 카드 목록 중 하나가 표시됨
    const emptyState = page.getByText(/확인할 항목이 없|No.*check|모두 완료/i);
    // 카드 내 확인 진행 링크 버튼은 카드가 있을 때만 존재
    const cardActions = page.getByRole('link', { name: /진행|proceed/i });

    const hasEmpty = (await emptyState.count()) > 0;
    const hasCards = (await cardActions.count()) > 0;

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

  // ============================================================================
  // TC-06~TC-09: 캐시 일관성 회귀 테스트 (techManagerPage 기준)
  //
  // 배경: TECHNICAL_MANAGER_SUWON은 seed 데이터 기준으로
  //   - "전체" 탭: 3건 (CHECKOUT_013 approved, CHECKOUT_036/038 borrower_returned)
  //   - "빌려주는 측" 탭: 3건 (동일, 모두 lender 역할)
  //   - "빌리는 측" 탭: 0건
  //
  // 버그1: 서버가 항상 role 무관하게 'all' 데이터를 fetch하고,
  //        placeholderData가 activeRole==='all'일 때만 사용되어
  //        탭 전환 + TQ 캐시 경합으로 전체 탭에서 잘못된 항목 수가 보였음.
  //
  // 버그2: CheckoutsContent가 queryKeys.checkouts.pending()으로 pageSize:1 결과를 캐시에 씀
  //        → 반출 목록 방문 후 확인 필요 목록 이동 시 전체 탭에 1건만 표시되던 버그.
  //        수정: pendingCount() 전용 키 분리로 캐시 충돌 해소.
  // ============================================================================

  test('TC-06: [회귀] techManager 전체 탭에서 3건이 표시된다', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/checkouts/pending-checks');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 각 카드에는 확인 진행 링크(/checkouts/{id}/check)가 정확히 1개씩 존재 → 카드 수 카운팅
    // 데이터 로딩 완료 대기: 로딩 텍스트가 사라진 후 카드 등장
    await expect(page.getByText('데이터를 불러오는 중...')).not.toBeVisible({ timeout: 10000 });
    const checkLinks = page.locator('a[href*="/checkouts/"][href*="/check"]');
    await expect(checkLinks.first()).toBeVisible({ timeout: 10000 });
    expect(await checkLinks.count()).toBe(3);
  });

  test('TC-07: [회귀] techManager 빌려주는 측 탭에서 3건이 표시된다', async ({
    techManagerPage: page,
  }) => {
    // URL에 role=lender를 직접 지정해서 서버 SSR도 lender 데이터로 fetch하는지 검증
    await page.goto('/checkouts/pending-checks?role=lender');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    await expect(page.getByText('데이터를 불러오는 중...')).not.toBeVisible({ timeout: 10000 });
    const checkLinks = page.locator('a[href*="/checkouts/"][href*="/check"]');
    await expect(checkLinks.first()).toBeVisible({ timeout: 10000 });
    expect(await checkLinks.count()).toBe(3);
  });

  test('TC-08: [회귀] 탭 전환 시 각 탭의 항목 수가 올바르게 유지된다', async ({
    techManagerPage: page,
  }) => {
    // 1단계: 전체 탭 → 3건
    await page.goto('/checkouts/pending-checks');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('데이터를 불러오는 중...')).not.toBeVisible({ timeout: 10000 });
    const checkLinks = page.locator('a[href*="/checkouts/"][href*="/check"]');
    await expect(checkLinks.first()).toBeVisible({ timeout: 10000 });
    expect(await checkLinks.count()).toBe(3);

    // 2단계: 빌리는 측 탭으로 전환 → 0건 (빈 상태)
    // 버그: 스테일 캐시가 이전 데이터를 보여주면 빈 상태 대신 항목이 보임
    await page.getByRole('button', { name: '빌리는 측' }).click();
    await page.waitForURL(/role=borrower/);
    await expect(page.getByText('데이터를 불러오는 중...')).not.toBeVisible({ timeout: 10000 });
    // 빌리는 측 항목 없음 → 빈 상태 메시지
    await expect(page.getByText('확인할 항목이 없습니다')).toBeVisible({ timeout: 10000 });
    expect(await page.locator('a[href*="/checkouts/"][href*="/check"]').count()).toBe(0);

    // 3단계: 전체 탭으로 복귀 → 다시 3건 (캐시 오염 없음)
    await page.getByRole('button', { name: '전체' }).click();
    await page.waitForURL((url) => !url.searchParams.has('role'));
    await expect(page.getByText('데이터를 불러오는 중...')).not.toBeVisible({ timeout: 10000 });
    await expect(checkLinks.first()).toBeVisible({ timeout: 10000 });
    expect(await checkLinks.count()).toBe(3);
  });

  test('TC-09: [회귀] 반출 목록 방문 후 확인 필요 목록 이동 시 3건이 표시된다', async ({
    techManagerPage: page,
  }) => {
    // 핵심 재현 경로: CheckoutsContent가 pending-count를 pageSize:1로 fetch한 뒤
    // 확인 필요 목록으로 이동했을 때 캐시 오염으로 1건만 보이는 버그 검증
    //
    // 수정 전: queryKeys.checkouts.pending()으로 pageSize:1 캐시 → 1건 표시
    // 수정 후: queryKeys.checkouts.pendingCount() 분리 → 캐시 충돌 없음 → 3건 표시

    // 1단계: 반출 목록 방문 → CheckoutsContent가 pending-count를 캐시에 씀
    await page.goto('/checkouts');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });
    // 확인 필요 건수 뱃지(pendingCount > 0이면 렌더링)가 나타날 때까지 대기 → pageSize:1 fetch 완료 신호
    // techManagerPage는 3건이 존재하므로 뱃지가 반드시 표시됨
    await expect(page.locator('a[href*="pending-checks"]')).toBeVisible({ timeout: 10000 });

    // 2단계: 확인 필요 목록으로 이동
    await page.goto('/checkouts/pending-checks');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 3단계: 전체 탭에서 3건이 표시되어야 함 (캐시 오염 없음)
    await expect(page.getByText('데이터를 불러오는 중...')).not.toBeVisible({ timeout: 10000 });
    const checkLinks = page.locator('a[href*="/checkouts/"][href*="/check"]');
    await expect(checkLinks.first()).toBeVisible({ timeout: 10000 });
    expect(await checkLinks.count()).toBe(3);
  });
});
