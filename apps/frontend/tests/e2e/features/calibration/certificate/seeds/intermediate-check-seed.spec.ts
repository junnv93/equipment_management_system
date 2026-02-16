import { test } from '../../../../shared/fixtures/auth.fixture';

/**
 * Seed: Group E - 중간점검 완료 워크플로우
 * 교정 목록 페이지의 중간점검 탭 준비
 */
test('setup - 중간점검 페이지 준비', async ({ techManagerPage: page }) => {
  await page.goto('/calibration');

  // Wait for page to load
  await page
    .getByRole('heading', { name: '교정 관리' })
    .waitFor({ state: 'visible', timeout: 15000 });

  // 중간점검 탭 클릭
  await page.getByRole('tab', { name: /중간점검/ }).click();

  // Wait for tab content to load
  await page.locator('table, .text-center').first().waitFor({ state: 'visible', timeout: 10000 });
});
