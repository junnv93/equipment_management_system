// spec: apps/frontend/tests/e2e/features/equipment/equipment-comprehensive.plan.md
// seed: apps/frontend/tests/e2e/shared/seed/equipment-seed.spec.ts

import { test, expect } from '../../../shared/fixtures/auth.fixture';

const EQUIPMENT_ID = 'eeee1007-0007-4007-8007-000000000007';

test.describe('장비 상세 - 9개 탭 전환', () => {
  test('모든 탭 전환 확인', async ({ techManagerPage: page }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}`);
    await expect(page.getByRole('heading', { name: '안테나 시스템 1' })).toBeVisible();

    // 기본 정보 탭이 기본 선택
    await expect(page.getByRole('tab', { name: '기본 정보 탭' })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    // 나머지 8개 탭 순회
    const tabNames = [
      '교정 이력 탭',
      '보정계수 탭',
      '반출 이력 탭',
      '위치 변동 탭',
      '유지보수 탭',
      '사고 이력 탭',
      '소프트웨어 탭',
      '첨부파일 탭',
    ];

    for (const tabName of tabNames) {
      const tab = page.getByRole('tab', { name: tabName });
      await tab.click();
      await expect(tab).toHaveAttribute('aria-selected', 'true');
      await expect(page.getByRole('tabpanel')).toBeVisible();
    }

    // 기본 정보 탭으로 복귀
    await page.getByRole('tab', { name: '기본 정보 탭' }).click();
    await expect(page.getByRole('tab', { name: '기본 정보 탭' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(page.getByText('장비 기본 정보')).toBeVisible();
  });
});
