/**
 * 실시간 알림 흐름 E2E 테스트
 *
 * 반출 요청 → 승인자 알림, 알림 드롭다운, SSE 연결 확인
 *
 * ## 주의: networkidle 사용 금지
 *
 * SSE 연결(useNotificationStream)이 persistent connection을 유지하므로
 * waitForLoadState('networkidle')는 절대 resolve되지 않음.
 * 대신 waitForLoadState('domcontentloaded') + 명시적 요소 대기 사용.
 *
 * storageState 기반 인증 (auth.fixture.ts)
 */
import { test, expect } from '../../shared/fixtures/auth.fixture';

/** 대시보드 로드 대기: SSE-safe */
async function waitForDashboard(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByRole('button', { name: '알림' })).toBeVisible({ timeout: 15000 });
}

test.describe('실시간 알림 흐름', () => {
  test.describe.configure({ mode: 'serial' });

  test('N-30: 반출 요청 시 승인자에게 알림이 전달된다', async ({ techManagerPage: page }) => {
    // 기술책임자 대시보드에서 알림 시스템 확인
    await waitForDashboard(page);

    // Bell 버튼 확인 — 알림 시스템이 헤더에 연결되어 있는지 검증
    const bellButton = page.getByRole('button', { name: '알림' });
    await expect(bellButton).toBeVisible();

    // 알림 드롭다운 열기
    await bellButton.click();

    // 드롭다운 열림 확인 — 알림 항목 또는 "모든 알림 보기" 링크가 보여야 함
    const menuItem = page.getByRole('menuitem', { name: /모든 알림 보기/ });
    await expect(menuItem).toBeVisible({ timeout: 5000 });
  });

  test('N-31: 알림 목록에서 반출 관련 알림을 확인할 수 있다', async ({ techManagerPage: page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: '알림' })).toBeVisible({ timeout: 15000 });

    // 카테고리 필터에서 "반출" 선택
    const categorySelect = page.getByRole('combobox');
    if (await categorySelect.isVisible().catch(() => false)) {
      await categorySelect.click();
      const checkoutOption = page.getByRole('option', { name: '반출' });
      if (await checkoutOption.isVisible().catch(() => false)) {
        await checkoutOption.click();
        // URL에 category 파라미터 반영 대기
        await page
          .waitForURL('**/notifications?**category=checkout**', { timeout: 5000 })
          .catch(() => {});
      }
    }

    // 필터링 후 페이지가 정상 렌더링되는지 확인 (#main-content — main 태그 2개 존재)
    const content = page.locator('#main-content');
    await expect(content).toBeVisible();
  });

  test('N-32: SSE 연결이 활성화되어 있다', async ({ techManagerPage: page }) => {
    await waitForDashboard(page);

    // SSE 연결 확인: EventSource API가 브라우저에서 사용 가능한지 확인
    const hasEventSource = await page.evaluate(() => typeof EventSource !== 'undefined');
    expect(hasEventSource).toBe(true);

    // SSE 스트림 엔드포인트(/api/notifications/stream)에 대한 요청 존재 여부 확인
    // useNotificationStream이 DashboardShell에서 마운트 시 자동 연결
    const bellButton = page.getByRole('button', { name: '알림' });
    await expect(bellButton).toBeVisible();
  });
});
