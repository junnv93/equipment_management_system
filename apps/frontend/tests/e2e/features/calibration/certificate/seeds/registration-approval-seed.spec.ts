import { test } from '../../../../shared/fixtures/auth.fixture';

/**
 * Seed: Group C - 교정 등록 → 승인 → 장비 상태 업데이트 통합 플로우
 * 승인 대기 목록 페이지 준비
 */
test('setup - 승인 대기 목록 페이지 준비', async ({ techManagerPage: page }) => {
  await page.goto('/admin/approvals?tab=calibration');

  // 승인 대기 목록 로드 확인
  await page
    .getByRole('heading', { name: '승인 관리' })
    .waitFor({ state: 'visible', timeout: 15000 });
});
