// spec: apps/frontend/tests/e2e/features/equipment/equipment-comprehensive.plan.md
// seed: apps/frontend/tests/e2e/shared/seed/equipment-seed.spec.ts

import { test, expect } from '../../../shared/fixtures/auth.fixture';

const EQUIPMENT_ID = 'eeee1007-0007-4007-8007-000000000007';

test.describe('역할별 권한 검증', () => {
  test('품질책임자 읽기 전용 확인', async ({ qualityManagerPage: page }) => {
    // 1. 목록 페이지 접근 가능
    await page.goto('/equipment');
    await expect(page.getByRole('heading', { name: '장비 관리' })).toBeVisible();

    // 2. 상세 페이지 접근 가능
    await page.goto(`/equipment/${EQUIPMENT_ID}`);
    await expect(page.getByRole('heading', { name: '안테나 시스템 1' })).toBeVisible();
    await expect(
      page.locator('#equipment-sticky-header').getByText('SUW-E0007', { exact: true })
    ).toBeVisible();

    // 3. 교정 이력 탭 → 교정 등록 미표시
    await page.getByRole('tab', { name: '교정 이력 탭' }).click();
    await expect(page.getByRole('tabpanel')).toBeVisible();
    await expect(page.getByRole('button', { name: '교정 등록' })).not.toBeVisible();

    // 4. 위치 변동 탭 → 등록 버튼 미표시
    await page.getByRole('tab', { name: '위치 변동 탭' }).click();
    await expect(page.getByRole('tabpanel')).toBeVisible();
    await expect(page.getByRole('button', { name: '위치 변경 등록' })).not.toBeVisible();

    // 5. 유지보수 탭 → 등록 버튼 미표시
    await page.getByRole('tab', { name: '유지보수 탭' }).click();
    await expect(page.getByRole('tabpanel')).toBeVisible();
    await expect(page.getByRole('button', { name: '유지보수 등록' })).not.toBeVisible();

    // 6. 사고 이력 탭 → 등록 버튼 미표시
    await page.getByRole('tab', { name: '사고 이력 탭' }).click();
    await expect(page.getByRole('tabpanel')).toBeVisible();
    await expect(page.getByRole('button', { name: '사고 등록' })).not.toBeVisible();
  });
});
