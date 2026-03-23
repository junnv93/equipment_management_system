// spec: apps/frontend/tests/e2e/features/equipment/equipment-comprehensive.plan.md
// seed: apps/frontend/tests/e2e/shared/seed/equipment-seed.spec.ts

import { test, expect } from '../../../shared/fixtures/auth.fixture';

const EQUIPMENT_ID = 'eeee1001-0001-4001-8001-000000000001';

test.describe('역할별 권한 검증', () => {
  test('시험실무자 권한 범위', async ({ testOperatorPage: page }) => {
    // 1. testOperatorPage로 /equipment 이동
    await page.goto('/equipment');

    // 2. link '장비 등록' and link '공용장비 등록' visible
    await expect(page.getByRole('link', { name: '장비 등록', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: '공용장비 등록' })).toBeVisible();

    // 3. goto /equipment/eeee1001-0001-4001-8001-000000000001 (available 상태 → 반출 신청 가능)
    await page.goto(`/equipment/${EQUIPMENT_ID}`);

    // 4. Verify heading '스펙트럼 분석기'
    await expect(page.getByRole('heading', { name: '스펙트럼 분석기' })).toBeVisible();

    // 5. Verify button '장비 정보 수정하기' visible (can edit)
    await expect(page.getByRole('button', { name: '장비 정보 수정하기' })).toBeVisible();

    // 6. Verify button '반출 신청하기' visible (can request checkout)
    await expect(page.getByRole('button', { name: '반출 신청하기' })).toBeVisible();

    // 7. Verify button '폐기 요청' visible (can request disposal for non-shared)
    await expect(page.getByRole('button', { name: '폐기 요청' })).toBeVisible();

    // 8. Click tab '교정 이력 탭' → verify calibration register button IS visible (only test_engineer can register - 직무분리)
    await page.getByRole('tab', { name: '교정 이력 탭' }).click();
    await expect(page.getByRole('button', { name: '교정 등록' })).toBeVisible();

    // 9. Click tab '위치 변동 탭' → verify '위치 변경 등록' button NOT visible
    await page.getByRole('tab', { name: '위치 변동 탭' }).click();
    await expect(page.getByRole('button', { name: '위치 변경 등록' })).not.toBeVisible();

    // 10. Click tab '유지보수 탭' → verify '유지보수 등록' button NOT visible
    await page.getByRole('tab', { name: '유지보수 탭' }).click();
    await expect(page.getByRole('button', { name: '유지보수 등록' })).not.toBeVisible();

    // 11. Click tab '사고 이력 탭' → verify '사고 등록' button NOT visible
    await page.getByRole('tab', { name: '사고 이력 탭' }).click();
    await expect(page.getByRole('button', { name: '사고 등록' })).not.toBeVisible();
  });
});
