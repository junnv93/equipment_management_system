/**
 * Suite List-IA: S11 — 빈 상태 3종 data-testid
 *
 * 검증 대상:
 * - 필터 결과 없음 → data-testid="empty-state-filtered"
 * - "완료" 탭 빈 상태 → data-testid="empty-state-completed"
 * - "진행 중" 탭 빈 상태 → data-testid="empty-state-in-progress"
 *
 * 전략:
 * - filtered: 존재 불가능한 검색어로 실제 API 호출 → empty-state-filtered
 * - completed/inProgress 순수 빈 상태: page.route()로 API 응답 모킹 → deterministic
 *   (seed 데이터가 있는 환경에서도 일관된 검증 가능)
 */
import path from 'path';
import { test, expect } from '../../../shared/fixtures/auth.fixture';

const EMPTY_CHECKOUTS_RESPONSE = {
  data: [],
  meta: {
    pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    summary: { total: 0, overdue: 0 },
  },
};

test.describe.configure({ mode: 'serial' });

test.describe('Suite List-IA S11: 빈 상태 3종', () => {
  test.use({
    storageState: path.join(__dirname, '../../../.auth/technical-manager.json'),
  });

  test('필터 결과 없음 → empty-state-filtered 표시', async ({ page }) => {
    await page.goto('/checkouts?search=XXXXXXXXXXX_NO_MATCH');
    await page.waitForLoadState('networkidle');

    const filtered = page.getByTestId('empty-state-filtered');
    await expect(filtered).toBeVisible({ timeout: 10000 });
  });

  test('completed 탭 빈 상태 → empty-state-completed 표시 (API 모킹)', async ({ page }) => {
    // API 응답을 비워 empty-state-completed를 강제 렌더
    await page.route('**/api/checkouts**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(EMPTY_CHECKOUTS_RESPONSE),
      });
    });

    await page.goto('/checkouts?subTab=completed');
    await page.waitForLoadState('networkidle');

    const completedEmpty = page.getByTestId('empty-state-completed');
    await expect(completedEmpty).toBeVisible({ timeout: 10000 });

    await page.unroute('**/api/checkouts**');
  });

  test('inProgress 탭 빈 상태 → empty-state-in-progress 표시 (API 모킹)', async ({ page }) => {
    // API 응답을 비워 empty-state-in-progress를 강제 렌더
    await page.route('**/api/checkouts**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(EMPTY_CHECKOUTS_RESPONSE),
      });
    });

    await page.goto('/checkouts');
    await page.waitForLoadState('networkidle');

    // inProgress 탭이 기본 활성
    const inProgressTab = page.getByRole('tab', { name: /진행 중/ });
    await expect(inProgressTab).toHaveAttribute('aria-selected', 'true');

    const inProgressEmpty = page.getByTestId('empty-state-in-progress');
    await expect(inProgressEmpty).toBeVisible({ timeout: 10000 });

    await page.unroute('**/api/checkouts**');
  });
});
