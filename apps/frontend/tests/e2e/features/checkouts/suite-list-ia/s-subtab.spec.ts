/**
 * Suite List-IA: S9 — 서브탭 IA + URL SSOT + 키보드
 *
 * 검증 대상:
 * - 기본 진입 시 "진행 중" 탭 active + URL에 ?subTab 없음 (inProgress는 기본값으로 생략)
 * - "완료" 탭 클릭 → URL ?subTab=completed
 * - role="tablist" + aria-selected WCAG 패턴
 * - ←/→ 키보드 전환
 */
import path from 'path';
import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe.configure({ mode: 'serial' });

test.describe('Suite List-IA S9: 서브탭 IA', () => {
  test.use({
    storageState: path.join(__dirname, '../../../.auth/technical-manager.json'),
  });

  test('기본 진입 시 "진행 중" 탭 active + URL에 subTab 없음', async ({ page }) => {
    await page.goto('/checkouts');
    await page.waitForLoadState('domcontentloaded');

    // role=tablist 존재
    const tablist = page.getByRole('tablist');
    await expect(tablist).toBeVisible();

    // 첫 번째 탭(inProgress)이 active
    const inProgressTab = page.getByRole('tab', { name: /진행 중/ });
    await expect(inProgressTab).toHaveAttribute('aria-selected', 'true');

    // URL에 subTab 없음 (기본값 생략)
    expect(page.url()).not.toContain('subTab');
  });

  test('"완료" 탭 클릭 → URL ?subTab=completed', async ({ page }) => {
    await page.goto('/checkouts');
    await page.waitForLoadState('domcontentloaded');

    const completedTab = page.getByRole('tab', { name: /완료/ });
    await completedTab.click();

    // URL 업데이트
    await expect(page).toHaveURL(/subTab=completed/);

    // aria-selected 전환
    await expect(completedTab).toHaveAttribute('aria-selected', 'true');
    const inProgressTab = page.getByRole('tab', { name: /진행 중/ });
    await expect(inProgressTab).toHaveAttribute('aria-selected', 'false');
  });

  test('←/→ 키보드로 탭 전환', async ({ page }) => {
    await page.goto('/checkouts');
    await page.waitForLoadState('domcontentloaded');

    const inProgressTab = page.getByRole('tab', { name: /진행 중/ });
    await inProgressTab.focus();
    await inProgressTab.press('ArrowRight');

    // 완료 탭으로 전환
    const completedTab = page.getByRole('tab', { name: /완료/ });
    await expect(completedTab).toHaveAttribute('aria-selected', 'true');
    await expect(page).toHaveURL(/subTab=completed/);

    // 다시 ← 로 돌아오기
    await completedTab.press('ArrowLeft');
    await expect(inProgressTab).toHaveAttribute('aria-selected', 'true');
  });
});
