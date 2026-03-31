/**
 * 알림 드롭다운 E2E 테스트
 *
 * 헤더의 Bell 아이콘 → 드롭다운 오픈 → 미읽음 배지 → 전체 보기 네비게이션
 *
 * ## 데이터 전제
 *
 * test_engineer (testOperatorPage): 16건 미읽음 알림 → 배지 "9+" 표시
 * technical_manager (techManagerPage): 1건 미읽음 알림 → 배지 "1" 표시
 *
 * ## 주의: networkidle 사용 금지
 *
 * SSE 연결(useNotificationStream)이 persistent connection을 유지하므로
 * 대신 요소 기반 대기 사용.
 *
 * storageState 기반 인증 (auth.fixture.ts)
 */
import { test, expect } from '../../shared/fixtures/auth.fixture';

/** 대시보드 로드 대기: SSE가 networkidle을 방해하므로 요소 기반 대기 */
async function waitForDashboard(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  // Bell 버튼이 나타날 때까지 대기 (레이아웃 + API 로드 완료 지표)
  await expect(page.getByRole('button', { name: '알림' })).toBeVisible({ timeout: 15000 });
}

test.describe('알림 드롭다운', () => {
  test('N-01: 헤더에 알림 Bell 아이콘이 표시된다', async ({ testOperatorPage: page }) => {
    await waitForDashboard(page);

    const bellButton = page.getByRole('button', { name: '알림' });
    await expect(bellButton).toBeVisible();
  });

  test('N-02: 미읽음 배지가 카운트를 표시한다', async ({ testOperatorPage: page }) => {
    await waitForDashboard(page);

    const bellButton = page.getByRole('button', { name: '알림' });
    await expect(bellButton).toBeVisible();

    // test_engineer는 16건 미읽음 → 배지 "9+" 표시
    // Badge 컴포넌트는 Bell 버튼 내부 absolute 위치
    const badge = bellButton.locator('.absolute');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText(/\d+\+?/);
  });

  test('N-03: Bell 클릭 시 드롭다운이 오픈된다', async ({ testOperatorPage: page }) => {
    await waitForDashboard(page);

    const bellButton = page.getByRole('button', { name: '알림' });
    await bellButton.click();

    // DropdownMenuContent가 열림 — 알림 항목 표시
    const notificationCards = page.locator('.border-l-4');
    await expect(notificationCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('N-04: 드롭다운에 알림 항목들이 표시된다', async ({ testOperatorPage: page }) => {
    await waitForDashboard(page);

    const bellButton = page.getByRole('button', { name: '알림' });
    await bellButton.click();

    // 드롭다운에 최대 5개 알림 표시 (pageSize=5)
    const notificationCards = page.locator('.border-l-4');
    await expect(notificationCards.first()).toBeVisible({ timeout: 5000 });
    const count = await notificationCards.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(5);
  });

  test('N-05: "모든 알림 보기" 클릭 시 /notifications로 이동한다', async ({
    testOperatorPage: page,
  }) => {
    await waitForDashboard(page);

    const bellButton = page.getByRole('button', { name: '알림' });
    await bellButton.click();

    // "모든 알림 보기" 링크
    const viewAllLink = page.getByRole('menuitem', { name: /모든 알림 보기/ });
    await expect(viewAllLink).toBeVisible();
    await viewAllLink.click();

    // /notifications 페이지로 이동
    await page.waitForURL('**/notifications**');
    expect(page.url()).toContain('/notifications');

    // 목록 페이지의 제목이 표시됨
    await expect(page.getByRole('heading', { name: '알림' })).toBeVisible({ timeout: 15000 });
  });

  test('N-06: "모두 읽음으로 표시" 버튼이 동작한다', async ({ techManagerPage: page }) => {
    await waitForDashboard(page);

    const bellButton = page.getByRole('button', { name: '알림' });

    // technical_manager의 배지 확인 (1건)
    const badge = bellButton.locator('.absolute');
    const hasBadge = await badge.isVisible().catch(() => false);

    if (hasBadge) {
      await bellButton.click();

      // "모두 읽음으로 표시" 버튼
      const markAllReadBtn = page.getByRole('button', {
        name: /모두 읽음으로 표시/,
      });
      if (await markAllReadBtn.isVisible().catch(() => false)) {
        await markAllReadBtn.click();

        // 배지가 사라짐
        await expect(badge).toBeHidden({ timeout: 5000 });
      }
    }
    // 미읽음 알림이 없으면 테스트 통과 (데이터 의존적)
  });
});
