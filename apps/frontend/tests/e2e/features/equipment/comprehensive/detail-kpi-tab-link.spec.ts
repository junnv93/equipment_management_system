// spec: apps/frontend/tests/e2e/features/equipment/equipment-comprehensive.plan.md
// seed: apps/frontend/tests/e2e/shared/seed/equipment-seed.spec.ts

import { test, expect } from '../../../shared/fixtures/auth.fixture';

const EQUIPMENT_ID = 'eeee1007-0007-4007-8007-000000000007';

test.describe('장비 상세 - KPI 스트립 탭 이동', () => {
  test('KPI 카드 클릭 시 대응 탭으로 전환', async ({ techManagerPage: page }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}`);
    await expect(page.getByRole('heading', { name: '안테나 시스템 1' })).toBeVisible();

    // 다음 교정일 카드 → 교정 이력 탭
    await page.getByRole('button', { name: '다음 교정일 탭으로 이동' }).click();
    await expect(page.getByRole('tab', { name: '교정 이력 탭' })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    // 유지보수 카드 → 유지보수 탭
    await page.getByRole('button', { name: '유지보수 탭으로 이동' }).click();
    await expect(page.getByRole('tab', { name: '유지보수 탭' })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    // 사고 이력 카드 → 사고 이력 탭
    await page.getByRole('button', { name: '사고 이력 탭으로 이동' }).click();
    await expect(page.getByRole('tab', { name: '사고 이력 탭' })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    // 반출 이력 카드 → 반출 이력 탭
    await page.getByRole('button', { name: '반출 이력 탭으로 이동' }).click();
    await expect(page.getByRole('tab', { name: '반출 이력 탭' })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    // 현재 위치 카드 → 위치 변동 탭
    await page.getByRole('button', { name: '현재 위치 탭으로 이동' }).click();
    await expect(page.getByRole('tab', { name: '위치 변동 탭' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });
});
