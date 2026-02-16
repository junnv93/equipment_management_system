import { test } from '../../../../shared/fixtures/auth.fixture';

/**
 * Seed: Group B - 교정 등록 폼 자동 계산 및 역할별 동작
 * 교정 등록 페이지를 열고 장비 목록 로드 대기
 */
test('setup - 교정 등록 페이지 준비', async ({ testOperatorPage: page }) => {
  await page.goto('/calibration/register');

  // 장비 목록이 로드될 때까지 대기
  await page
    .getByRole('heading', { name: '교정 정보 등록' })
    .waitFor({ state: 'visible', timeout: 15000 });
});
