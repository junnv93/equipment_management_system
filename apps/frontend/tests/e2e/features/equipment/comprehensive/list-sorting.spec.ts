// spec: apps/frontend/tests/e2e/features/equipment/equipment-comprehensive.plan.md
// seed: apps/frontend/tests/e2e/shared/seed/equipment-seed.spec.ts

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('장비 목록 - 정렬', () => {
  test('컬럼 헤더 클릭으로 정렬 변경', async ({ techManagerPage: page }) => {
    await page.goto('/equipment');
    await expect(page.getByRole('heading', { name: '장비 관리' })).toBeVisible();

    // 교정 기한 컬럼 헤더 클릭 → 정렬 적용 (기본 정렬 기준이 아니므로 URL에 sortBy 파라미터 추가됨)
    const calHeader = page.getByRole('columnheader').filter({ hasText: '교정 기한' });
    await calHeader.getByRole('button').click();
    await expect(page).toHaveURL(/sortBy/);

    // 장비명 컬럼 헤더 클릭 → 다른 필드로 정렬
    const nameHeader = page.getByRole('columnheader').filter({ hasText: '장비명' });
    await nameHeader.getByRole('button').click();
    await expect(page).toHaveURL(/sortBy/);
    await expect(page.getByRole('status', { name: '검색 결과 요약' })).toContainText('정렬');
  });
});
