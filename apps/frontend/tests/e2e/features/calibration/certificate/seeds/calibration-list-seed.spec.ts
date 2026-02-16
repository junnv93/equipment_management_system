import { test } from '../../../../shared/fixtures/auth.fixture';

/**
 * Seed: Group A - 교정 목록 데이터 통합 검증
 * 페이지를 열고 기본 데이터 로드 대기
 */
test('setup - 교정 목록 페이지 준비', async ({ techManagerPage: page }) => {
  await page.goto('/calibration');

  // 통계 카드가 로드될 때까지 대기
  await page.getByText('전체 교정 장비').waitFor({ state: 'visible', timeout: 15000 });
});
