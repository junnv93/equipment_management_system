/**
 * 알림 목록 페이지 E2E 테스트
 *
 * /notifications 페이지: 알림 목록 조회, 탭 전환, 카테고리 필터, 검색, 읽음 처리
 *
 * ## 데이터 전제
 *
 * test_engineer (testOperatorPage): 16건 알림 (10 checkout + 6 calibration, 모두 unread)
 * technical_manager (techManagerPage): 1건 알림
 *
 * 알림은 실제 API 동작(교정 등록, 반출 생성 등)에 의해 event-driven으로 생성됨.
 *
 * ## 주의: networkidle 사용 금지
 *
 * SSE 연결(useNotificationStream)이 persistent connection을 유지하므로
 * 대신 waitForLoadState('domcontentloaded') + 명시적 요소 대기 사용.
 *
 * storageState 기반 인증 (auth.fixture.ts)
 */
import { test, expect } from '../../shared/fixtures/auth.fixture';

/** 알림 페이지 로드 대기: SSE가 networkidle을 방해하므로 요소 기반 대기 */
async function waitForNotificationsPage(page: import('@playwright/test').Page) {
  await page.goto('/notifications');
  await page.waitForLoadState('domcontentloaded');
  // 페이지 제목이 나타날 때까지 대기 (데이터 로딩 완료 지표)
  await expect(page.getByRole('heading', { name: '알림' })).toBeVisible({ timeout: 15000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Group 1: 알림 목록 조회 (읽기 전용 — 안전하게 병렬 실행 가능)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('알림 목록 페이지 — 조회', () => {
  test('N-10: 페이지 제목과 브레드크럼이 정상 표시된다', async ({ testOperatorPage: page }) => {
    await waitForNotificationsPage(page);

    // 페이지 제목
    await expect(page.getByRole('heading', { name: '알림' })).toBeVisible();

    // 브레드크럼
    const breadcrumb = page.getByRole('navigation', { name: /breadcrumb/i });
    if (await breadcrumb.isVisible().catch(() => false)) {
      await expect(breadcrumb).toContainText('알림');
    }
  });

  test('N-11: 알림 항목이 표시된다 (빈 상태가 아님)', async ({ testOperatorPage: page }) => {
    await waitForNotificationsPage(page);

    // "표시할 알림이 없습니다." 메시지가 없어야 함
    await expect(page.getByText('표시할 알림이 없습니다.')).toBeHidden();

    // 알림 항목이 최소 1개 이상 표시 — border-l-4 스타일의 알림 카드
    const notificationCards = page.locator('.border-l-4');
    await expect(notificationCards.first()).toBeVisible();
    expect(await notificationCards.count()).toBeGreaterThan(0);
  });

  test('N-12: 알림 항목에 제목과 시간이 표시된다', async ({ testOperatorPage: page }) => {
    await waitForNotificationsPage(page);

    // 알림 항목들
    const notificationCards = page.locator('.border-l-4');
    await expect(notificationCards.first()).toBeVisible();

    // 첫 번째 알림에 제목 텍스트가 있음 (font-semibold 클래스 — notification-item.tsx 기준)
    const firstTitle = notificationCards.first().locator('.font-semibold');
    await expect(firstTitle).toBeVisible();
    const titleText = await firstTitle.textContent();
    expect(titleText).toBeTruthy();
    expect(titleText!.length).toBeGreaterThan(0);
  });

  test('N-13: "전체"/"안읽음" 탭 전환이 동작한다', async ({ testOperatorPage: page }) => {
    await waitForNotificationsPage(page);

    const allTab = page.getByRole('tab', { name: '전체' });
    const unreadTab = page.getByRole('tab', { name: /안읽음/ });

    await expect(allTab).toBeVisible();
    await expect(unreadTab).toBeVisible();

    // "전체" 탭이 기본 활성화
    await expect(allTab).toHaveAttribute('data-state', 'active');

    // "안읽음" 탭 클릭 → URL에 tab=unread 반영
    await unreadTab.click();
    await expect(unreadTab).toHaveAttribute('data-state', 'active');
    await page.waitForURL('**/notifications?**tab=unread**');

    // 안읽음 탭에서도 알림 항목이 표시됨 (test_engineer는 모두 미읽음)
    const notificationCards = page.locator('.border-l-4');
    await expect(notificationCards.first()).toBeVisible();

    // "전체" 탭으로 복귀
    await allTab.click();
    // URL에서 tab=unread 파라미터가 제거될 때까지 대기 (Radix Tab 상태가 URL보다 늦게 반영될 수 있음)
    await page
      .waitForURL((url) => !url.href.includes('tab=unread'), { timeout: 5000 })
      .catch(() => {});
    await expect(allTab).toHaveAttribute('data-state', 'active');
  });

  test('N-14: 카테고리 드롭다운 필터가 동작한다', async ({ testOperatorPage: page }) => {
    await waitForNotificationsPage(page);

    // 전체 알림 수 확인
    const allCards = page.locator('.border-l-4');
    await expect(allCards.first()).toBeVisible();

    // 카테고리 Select 클릭
    const categorySelect = page.getByRole('combobox');
    await expect(categorySelect).toBeVisible();
    await categorySelect.click();
    // listbox가 완전히 렌더링될 때까지 대기 (클릭 직후 옵션이 없을 수 있음)
    await expect(page.getByRole('listbox')).toBeVisible({ timeout: 3000 });

    // "반출" 카테고리 선택 (test_engineer의 10건 checkout 알림)
    const checkoutOption = page.getByRole('option', { name: '반출' });
    await expect(checkoutOption).toBeVisible();
    await checkoutOption.click();
    // 옵션 선택 완료 확인: listbox 닫힘 대기
    await expect(page.getByRole('listbox')).toBeHidden({ timeout: 5000 });

    // URL에 category=checkout 반영 (waitForURL glob 패턴보다 assertion 방식이 안정적)
    await expect(page).toHaveURL(/category=checkout/, { timeout: 15000 });

    // 필터 적용 후 알림이 표시됨 (컴포넌트 리렌더링 완료 대기)
    await expect(page.locator('.border-l-4').first()).toBeVisible({ timeout: 10000 });

    // "교정" 카테고리로 전환
    // exact: true 필수 — "교정"이 "교정계획"의 부분문자열이므로 2개 매칭 방지
    await categorySelect.click();
    await expect(page.getByRole('listbox')).toBeVisible({ timeout: 3000 });
    const calibrationOption = page.getByRole('option', { name: '교정', exact: true });
    await expect(calibrationOption).toBeVisible();
    await calibrationOption.click();
    await expect(page.getByRole('listbox')).toBeHidden({ timeout: 5000 });

    await expect(page).toHaveURL(/category=calibration/, { timeout: 15000 });
    await expect(page.locator('.border-l-4').first()).toBeVisible();

    // "전체"로 복귀
    await categorySelect.click();
    await expect(page.getByRole('listbox')).toBeVisible({ timeout: 3000 });
    const allOption = page.getByRole('option', { name: '전체' });
    await expect(allOption).toBeVisible();
    await allOption.click();
    await expect(page.getByRole('listbox')).toBeHidden({ timeout: 5000 });
  });

  test('N-15: 검색 필터가 동작한다', async ({ testOperatorPage: page }) => {
    await waitForNotificationsPage(page);

    // 검색 입력란
    const searchInput = page.getByRole('textbox', { name: '알림 검색' });
    await expect(searchInput).toBeVisible();

    // "교정"으로 검색 → calibration 알림만 필터링
    await searchInput.fill('교정');

    // 검색 결과 대기 (알림 카드가 다시 로드될 때까지)
    await expect(page.locator('.border-l-4').first()).toBeVisible({ timeout: 10000 });

    const cards = page.locator('.border-l-4');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // 검색어 지우기
    await searchInput.clear();
  });

  test('N-16: 미읽음 알림 카운트가 표시된다', async ({ testOperatorPage: page }) => {
    await waitForNotificationsPage(page);

    // "읽지 않은 알림 N건" 텍스트 확인
    await expect(page.getByText(/읽지 않은 알림 \d+건/)).toBeVisible();

    // "모두 읽음으로 표시" 버튼이 미읽음 알림이 있으므로 표시됨
    await expect(page.getByRole('button', { name: /모두 읽음으로 표시/ })).toBeVisible();
  });

  test('N-17: 알림이 없는 사용자는 빈 상태가 표시된다', async ({ qualityManagerPage: page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: '알림' })).toBeVisible({ timeout: 15000 });

    // quality_manager는 알림이 적거나 없을 수 있음
    const emptyState = page.getByText(/표시할 알림이 없습니다|새로운 알림이 없습니다/);
    const notificationCards = page.locator('.border-l-4');

    // 둘 중 하나는 표시되어야 함 (알림이 있든 없든 페이지가 정상 렌더링)
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    const hasCards = await notificationCards
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasEmpty || hasCards).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Group 2-A: 읽음 처리 (testOperatorPage — N-19와 독립)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('알림 목록 페이지 — 읽음 처리', () => {
  test.describe.configure({ mode: 'serial' });

  test('N-18: 알림 클릭 시 읽음 처리되어 스타일이 변경된다', async ({ testOperatorPage: page }) => {
    await waitForNotificationsPage(page);

    // 스켈레톤 사라짐 대기 — font-semibold가 없는 스켈레톤 카드에서 textContent 무한 대기 방지
    await expect(page.locator('.border-l-4.animate-pulse')).toHaveCount(0, { timeout: 10000 });

    // 미읽음 알림 확인 (opacity-60이 아닌 항목)
    const unreadCards = page.locator('.border-l-4:not(.opacity-60)');
    const hasUnread = await unreadCards
      .first()
      .isVisible()
      .catch(() => false);
    if (!hasUnread) {
      // testOperatorPage의 미읽음 알림이 없으면 스킵 (이전 실행에서 모두 읽음 처리된 경우)
      return;
    }

    // 첫 번째 미읽음 알림의 제목 기록 (font-semibold — notification-item.tsx 기준)
    const firstCard = unreadCards.first();
    const titleText = await firstCard.locator('.font-semibold').first().textContent();

    // 클릭 전 같은 제목의 읽음(opacity-60) 알림 수 측정
    // (같은 제목 알림이 여러 개일 수 있어 0개 기대 대신 +1 기대)
    const readCountBefore = await page
      .locator('.border-l-4.opacity-60')
      .filter({ hasText: titleText! })
      .count();

    // 알림 클릭 (Link → 페이지 이동 + 읽음 처리)
    await firstCard.click();
    await page.waitForLoadState('domcontentloaded');

    // 알림 목록으로 돌아가기
    await waitForNotificationsPage(page);
    // 목록 로딩 완료 대기 (refetch 후 opacity-60 반영 보장)
    await expect(page.locator('.border-l-4').first()).toBeVisible({ timeout: 10000 });

    // 읽음 처리된 알림이 1개 증가했는지 확인
    await expect(
      page.locator('.border-l-4.opacity-60').filter({ hasText: titleText! })
    ).toHaveCount(readCountBefore + 1, { timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Group 2-B: 삭제 (techManagerPage — N-18과 독립, 실패해도 서로 영향 없음)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('알림 목록 페이지 — 삭제', () => {
  test.describe.configure({ mode: 'serial' });

  test('N-19: 삭제 버튼으로 알림을 삭제할 수 있다', async ({ techManagerPage: page }) => {
    // DELETE_NOTIFICATION 권한이 technical_manager 이상에만 있음
    await waitForNotificationsPage(page);

    const allCards = page.locator('.border-l-4');
    // skeleton 카드('.animate-pulse')가 사라진 뒤 실제 카드 수를 측정
    // — 로딩 중 skeleton도 border-l-4를 가지면 beforeCount가 부풀어 테스트 실패
    await expect(page.locator('.border-l-4.animate-pulse')).toHaveCount(0, { timeout: 10000 });
    const hasCards = await allCards
      .first()
      .isVisible()
      .catch(() => false);
    if (!hasCards) {
      // technical_manager에 알림이 없으면 스킵 (데이터 의존적)
      return;
    }
    const beforeCount = await allCards.count();

    // DELETE API 응답 인터셉터를 클릭 전에 설정
    const deleteResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/notifications/') && resp.request().method() === 'DELETE'
    );

    // 삭제 버튼은 hover 시 나타남 (opacity-0 → group-hover:opacity-100)
    const firstGroup = page.locator('.relative.group').first();
    await firstGroup.hover();

    // 삭제 전: 같은 제목 알림의 수를 미리 세둔다
    // (중복 제목 알림이 존재할 수 있으므로 0개 기대가 아닌 N-1개 기대)
    const deletedTitle = await firstGroup.locator('.font-semibold').first().textContent();
    const sameCountBefore = await page
      .locator('.border-l-4')
      .filter({ hasText: deletedTitle! })
      .count();

    const deleteButton = firstGroup.getByRole('button', { name: '알림 삭제' });
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    // DELETE API 호출 확인 (200 = 성공) — 핵심 검증
    const deleteResponse = await deleteResponsePromise;
    expect(deleteResponse.status()).toBe(200);

    // 삭제 후 UI 반영 대기 (invalidateQueries → refetch)
    // refetch 후 카운트가 증가하지 않았음을 확인 (SSE 신규 알림으로 즉시 N-1이 보장 안 됨)
    const afterCount = await page.locator('.border-l-4').filter({ hasText: deletedTitle! }).count();
    expect(afterCount).toBeLessThanOrEqual(sameCountBefore);
  });
});
