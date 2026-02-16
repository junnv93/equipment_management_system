import { test } from '../../../../shared/fixtures/auth.fixture';

/**
 * Seed: Group F - URL 필터 상태 관리 (SSOT 검증)
 * 교정 목록 페이지 준비 (필터 테스트용)
 */
test('setup - URL 필터 페이지 준비', async ({ techManagerPage: page }) => {
  await page.goto('/calibration');

  // 필터 UI 로드 확인
  await page.getByText('전체 교정 장비').waitFor({ state: 'visible', timeout: 15000 });
});
