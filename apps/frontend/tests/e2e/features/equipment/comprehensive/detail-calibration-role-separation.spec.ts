// spec: apps/frontend/tests/e2e/features/equipment/equipment-comprehensive.plan.md
// seed: apps/frontend/tests/e2e/shared/seed/equipment-seed.spec.ts

import { test, expect } from '../../../shared/fixtures/auth.fixture';

const EQUIPMENT_ID = 'eeee1007-0007-4007-8007-000000000007';

test.describe('교정 등록 직무분리 확인 (UL-QP-18)', () => {
  test('기술책임자는 교정 등록 불가', async ({ techManagerPage: page }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}`);
    await expect(page.getByRole('heading', { name: '안테나 시스템 1' })).toBeVisible();

    await page.getByRole('tab', { name: '교정 이력 탭' }).click();
    await expect(page.getByRole('tabpanel')).toBeVisible();
    await expect(page.getByRole('button', { name: '교정 등록' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: '교정 등록' })).not.toBeVisible();
  });

  test('시험소장은 교정 등록 불가', async ({ siteAdminPage: page }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}`);
    await expect(page.getByRole('heading', { name: '안테나 시스템 1' })).toBeVisible();

    await page.getByRole('tab', { name: '교정 이력 탭' }).click();
    await expect(page.getByRole('tabpanel')).toBeVisible();
    await expect(page.getByRole('button', { name: '교정 등록' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: '교정 등록' })).not.toBeVisible();
  });
});
