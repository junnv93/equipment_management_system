import { test } from '../../../../shared/fixtures/auth.fixture';

/**
 * Seed: Group G - 권한 검증 및 에러 처리
 * 여러 역할의 페이지 준비
 */
test('setup - 권한 검증 페이지 준비', async ({ techManagerPage: page }) => {
  await page.goto('/calibration');

  // 기본 페이지 로드 확인
  await page.getByText('전체 교정 장비').waitFor({ state: 'visible', timeout: 15000 });
});
