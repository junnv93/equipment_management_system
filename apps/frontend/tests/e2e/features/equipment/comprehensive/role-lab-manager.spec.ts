// spec: apps/frontend/tests/e2e/features/equipment/equipment-comprehensive.plan.md
// seed: apps/frontend/tests/e2e/shared/seed/equipment-seed.spec.ts

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { TEST_EQUIPMENT_IDS } from '../../../shared/constants/shared-test-data';

const EQUIPMENT_ID = TEST_EQUIPMENT_IDS.ANTENNA_1_SUW_E;

test.describe('역할별 권한 검증', () => {
  test('시험소장 권한 범위', async ({ siteAdminPage: page }) => {
    // 1. siteAdminPage goto /equipment
    await page.goto('/equipment');

    // 2. Verify link '장비 등록' visible
    await expect(page.getByRole('link', { name: '장비 등록', exact: true })).toBeVisible();

    // 3. goto detail page, verify heading '안테나 시스템 1'
    await page.goto(`/equipment/${EQUIPMENT_ID}`);
    await expect(page.getByRole('heading', { name: '안테나 시스템 1' })).toBeVisible();

    // 4. Verify link '장비 정보 수정하기' visible
    await expect(page.getByRole('link', { name: '장비 정보 수정하기' })).toBeVisible();

    // 5. Click tab '교정 이력 탭' → verify 교정 등록 NOT visible (직무분리)
    await page.getByRole('tab', { name: '교정 이력 탭' }).click();
    await expect(page.getByRole('button', { name: '교정 등록' })).not.toBeVisible();

    // 6. Click tab '위치 변동 탭' → verify '위치 변경 등록' button IS visible
    await page.getByRole('tab', { name: '위치 변동 탭' }).click();
    await expect(page.getByRole('button', { name: '위치 변경 등록' })).toBeVisible();

    // 7. Click tab '유지보수 탭' → verify '유지보수 등록' button IS visible
    await page.getByRole('tab', { name: '유지보수 탭' }).click();
    await expect(page.getByRole('button', { name: '유지보수 등록' })).toBeVisible();

    // 8. Click tab '사고 이력 탭' → verify '사고 등록' button IS visible
    await page.getByRole('tab', { name: '사고 이력 탭' }).click();
    await expect(page.getByRole('button', { name: '사고 등록' })).toBeVisible();
  });
});
