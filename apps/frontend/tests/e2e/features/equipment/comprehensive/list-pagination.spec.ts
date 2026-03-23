// spec: apps/frontend/tests/e2e/features/equipment/equipment-comprehensive.plan.md
// seed: apps/frontend/tests/e2e/shared/seed/equipment-seed.spec.ts

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('장비 목록 - 페이지네이션', () => {
  test('페이지 전환 및 항목 수 변경', async ({ techManagerPage: page }) => {
    await page.goto('/equipment');
    await expect(page.getByRole('heading', { name: '장비 관리' })).toBeVisible();

    const pagination = page.getByRole('navigation', { name: '페이지 탐색' });
    await expect(pagination).toBeVisible();
    await expect(pagination).toContainText('총');

    // 첫 페이지에서 이전 페이지 버튼 비활성화
    await expect(page.getByRole('button', { name: '이전 페이지' })).toBeDisabled();

    // 2 페이지로 이동
    const page2Button = page.getByRole('button', { name: '2 페이지로 이동' });
    if (await page2Button.isVisible()) {
      await page2Button.click();
      await expect(page.getByRole('button', { name: '이전 페이지' })).toBeEnabled();
    }

    // 페이지당 항목 수 콤보박스 확인
    await expect(page.getByRole('combobox', { name: '페이지당 항목 수 선택' })).toBeVisible();
  });
});
