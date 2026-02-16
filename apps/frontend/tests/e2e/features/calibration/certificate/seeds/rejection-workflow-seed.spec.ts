import { test } from '../../../../shared/fixtures/auth.fixture';

/**
 * Seed: Group D - 교정 반려 워크플로우
 * 승인 대기 목록 페이지 준비 (반려 테스트용)
 */
test('setup - 반려 워크플로우 페이지 준비', async ({ techManagerPage: page }) => {
  await page.goto('/admin/calibration-approvals');

  // 승인 대기 목록 로드 확인
  await page
    .getByRole('heading', { name: '교정 승인' })
    .waitFor({ state: 'visible', timeout: 15000 });
});
