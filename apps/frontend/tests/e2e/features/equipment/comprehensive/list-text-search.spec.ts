// spec: apps/frontend/tests/e2e/features/equipment/equipment-comprehensive.plan.md
// seed: apps/frontend/tests/e2e/shared/seed/equipment-seed.spec.ts

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('장비 목록 - 텍스트 검색', () => {
  test('장비명으로 검색', async ({ techManagerPage: page }) => {
    await page.goto('/equipment');
    await expect(page.getByRole('heading', { name: '장비 관리' })).toBeVisible();

    const searchBox = page.getByPlaceholder('장비명, 모델명, 관리번호로 검색');
    await expect(searchBox).toBeVisible();

    // '스펙트럼'으로 검색
    await searchBox.fill('스펙트럼');
    await searchBox.press('Enter');
    // 스펙트럼 관련 장비만 표시
    await expect(page.getByRole('grid', { name: '장비 목록' })).toContainText('스펙트럼');

    // 검색어 삭제 후 전체 목록 복원
    await searchBox.clear();
    await searchBox.press('Enter');
    await expect(page.getByRole('status', { name: '검색 결과 요약' })).toBeVisible();
  });

  test('관리번호로 검색', async ({ techManagerPage: page }) => {
    await page.goto('/equipment');
    await expect(page.getByRole('heading', { name: '장비 관리' })).toBeVisible();

    const searchBox = page.getByPlaceholder('장비명, 모델명, 관리번호로 검색');
    await searchBox.fill('SUW-E0007');
    await searchBox.press('Enter');

    // 검색 결과 로드 대기 후 안테나 시스템 1만 표시 확인
    await expect(page.getByRole('grid', { name: '장비 목록' })).toContainText('SUW-E0007');
    await expect(page.getByRole('grid', { name: '장비 목록' })).toContainText('안테나 시스템 1');
  });
});
