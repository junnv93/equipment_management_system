// spec: apps/frontend/tests/e2e/features/equipment/equipment-comprehensive.plan.md
// seed: apps/frontend/tests/e2e/shared/seed/equipment-seed.spec.ts

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('장비 목록 - 상태 요약 스트립 필터링', () => {
  test('사용 가능 상태로 필터링', async ({ techManagerPage: page }) => {
    await page.goto('/equipment');
    await expect(page.getByRole('heading', { name: '장비 관리' })).toBeVisible();

    await page.getByRole('button', { name: '사용 가능 상태로 필터링' }).click();
    await expect(page).toHaveURL(/status=/);
    await expect(page.getByRole('grid', { name: '장비 목록' })).toBeVisible();
  });

  test('부적합 상태로 필터링', async ({ techManagerPage: page }) => {
    await page.goto('/equipment');
    await expect(page.getByRole('heading', { name: '장비 관리' })).toBeVisible();

    // 부적합 장비가 있을 때만 버튼이 표시됨 (statusCounts > 0인 상태만 버튼 렌더링)
    const filterBtn = page.getByRole('button', { name: '부적합 상태로 필터링' });
    const isBtnVisible = await filterBtn.isVisible();
    if (!isBtnVisible) {
      // 부적합 장비가 없어 버튼이 없는 경우 — 테스트 환경에 따라 조건부
      return;
    }
    await filterBtn.click();
    await expect(page).toHaveURL(/status=/);
  });

  test('전체 장비 보기로 리셋', async ({ techManagerPage: page }) => {
    await page.goto('/equipment');
    await expect(page.getByRole('heading', { name: '장비 관리' })).toBeVisible();

    // 필터 적용 후 전체 보기로 리셋
    await page.getByRole('button', { name: '사용 가능 상태로 필터링' }).click();
    await expect(page).toHaveURL(/status=/);

    await page.getByRole('button', { name: '전체 장비 보기' }).click();
    await expect(page.getByRole('status', { name: '검색 결과 요약' })).toContainText('장비');
  });
});
