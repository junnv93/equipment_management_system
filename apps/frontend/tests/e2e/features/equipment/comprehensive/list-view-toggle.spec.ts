// spec: apps/frontend/tests/e2e/features/equipment/equipment-comprehensive.plan.md
// seed: apps/frontend/tests/e2e/shared/seed/equipment-seed.spec.ts

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('장비 목록 - 뷰 전환', () => {
  test('테이블 ↔ 카드 뷰 전환', async ({ techManagerPage: page }) => {
    await page.goto('/equipment');
    await expect(page.getByRole('heading', { name: '장비 관리' })).toBeVisible();

    const tableRadio = page.getByRole('radio', { name: '테이블 뷰' });
    const cardRadio = page.getByRole('radio', { name: '카드 뷰' });

    // 기본값: 테이블 뷰
    await expect(tableRadio).toBeChecked();
    await expect(page.getByRole('grid', { name: '장비 목록' })).toBeVisible();

    // 카드 뷰로 전환
    await cardRadio.click();
    await expect(cardRadio).toBeChecked();
    await expect(page.getByRole('grid', { name: '장비 목록' })).not.toBeVisible();

    // 다시 테이블 뷰로 복원
    await tableRadio.click();
    await expect(tableRadio).toBeChecked();
    await expect(page.getByRole('grid', { name: '장비 목록' })).toBeVisible();
  });
});
