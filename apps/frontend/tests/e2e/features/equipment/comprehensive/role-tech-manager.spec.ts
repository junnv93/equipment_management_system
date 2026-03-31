// spec: apps/frontend/tests/e2e/features/equipment/equipment-comprehensive.plan.md
// seed: apps/frontend/tests/e2e/shared/seed/equipment-seed.spec.ts

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { TEST_EQUIPMENT_IDS } from '../../../shared/constants/shared-test-data';

const EQUIPMENT_ID = TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E;

test.describe('역할별 권한 검증', () => {
  test('기술책임자 권한 범위', async ({ techManagerPage: page }) => {
    // 1. techManagerPage로 /equipment 이동
    await page.goto('/equipment');
    await page.getByText('장비 등록').first().waitFor({ state: 'visible' });

    // 2. link '장비 등록' 표시 확인
    await expect(page.getByRole('link', { name: '장비 등록', exact: true })).toBeVisible();

    // 3. 스펙트럼 분석기 상세 페이지 이동 (available 상태 → 반출 신청 가능)
    await page.goto(`/equipment/${EQUIPMENT_ID}`);
    await page.getByText('스펙트럼 분석기').first().waitFor({ state: 'visible' });

    // 4. heading '스펙트럼 분석기' 표시 확인
    await expect(page.getByRole('heading', { name: '스펙트럼 분석기', level: 1 })).toBeVisible();

    // 5. button '장비 정보 수정하기', button '반출 신청하기', button '폐기 요청' 표시 확인
    await expect(page.getByRole('button', { name: '장비 정보 수정하기' })).toBeVisible();
    await expect(page.getByRole('button', { name: '반출 신청하기' })).toBeVisible();
    await expect(page.getByRole('button', { name: '폐기 요청' })).toBeVisible();

    // 6. 교정 이력 탭 클릭 → 교정 등록 버튼/링크 NOT visible 확인 (직무분리 - only test_engineer)
    await page.getByRole('tab', { name: '교정 이력 탭' }).click();
    await page.getByRole('tabpanel', { name: '교정 이력 탭' }).waitFor({ state: 'visible' });
    await expect(page.getByRole('button', { name: '교정 등록' })).not.toBeVisible();

    // 7. 위치 변동 탭 클릭 → '위치 변경 등록' 버튼 IS visible 확인 (tech_manager 가능)
    await page.getByRole('tab', { name: '위치 변동 탭' }).click();
    await page.getByRole('tabpanel', { name: '위치 변동 탭' }).waitFor({ state: 'visible' });
    await expect(page.getByRole('button', { name: '위치 변경 등록' })).toBeVisible();
  });
});
