// spec: apps/frontend/tests/e2e/features/equipment/equipment-comprehensive.plan.md
// seed: apps/frontend/tests/e2e/shared/seed/equipment-seed.spec.ts

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { TEST_EQUIPMENT_IDS } from '../../../shared/constants/shared-test-data';

const EQUIPMENT_ID = TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E;

/**
 * exact text matcher for dt (term) elements
 * hasText는 부분 매칭이므로 '제조사'가 '제조사 연락처'도 매칭함.
 * getByText(exact: true)로 정확한 dt를 찾은 뒤 visible 확인.
 */
function termExact(page: import('@playwright/test').Page, text: string) {
  return page.getByRole('term').filter({ has: page.getByText(text, { exact: true }) });
}

test.describe('장비 상세 - 기본 정보 탭 표시', () => {
  test('기본 정보 탭 표시 확인', async ({ techManagerPage: page }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}`);

    // Sticky 헤더
    await expect(page.getByRole('heading', { name: '스펙트럼 분석기' })).toBeVisible();
    await expect(
      page.locator('#equipment-sticky-header').getByText('SUW-E0001', { exact: true })
    ).toBeVisible();

    // KPI 스트립 5개 카드
    await expect(page.getByRole('button', { name: '다음 교정일 탭으로 이동' })).toBeVisible();
    await expect(page.getByRole('button', { name: '현재 위치 탭으로 이동' })).toBeVisible();
    await expect(page.getByRole('button', { name: '반출 이력 탭으로 이동' })).toBeVisible();
    await expect(page.getByRole('button', { name: '유지보수 탭으로 이동' })).toBeVisible();
    await expect(page.getByRole('button', { name: '사고 이력 탭으로 이동' })).toBeVisible();

    // 기본 정보 탭이 기본 선택
    await expect(page.getByRole('tab', { name: '기본 정보 탭' })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    // 장비 기본 정보 섹션 — termExact로 strict mode 안전
    await expect(page.getByText('장비 기본 정보')).toBeVisible();
    await expect(termExact(page, '장비명')).toBeVisible();
    await expect(
      page.getByRole('definition').filter({ hasText: '스펙트럼 분석기' }).first()
    ).toBeVisible();
    await expect(termExact(page, '관리번호')).toBeVisible();
    await expect(
      page.getByRole('definition').filter({ hasText: 'SUW-E0001' }).first()
    ).toBeVisible();
    await expect(termExact(page, '제조사')).toBeVisible();
    await expect(termExact(page, '시리얼번호')).toBeVisible();

    // 교정 정보 섹션
    await expect(page.getByText('교정 정보')).toBeVisible();
    await expect(termExact(page, '교정 필요 여부')).toBeVisible();
    await expect(termExact(page, '교정 방법')).toBeVisible();

    // 위치 및 관리 정보 섹션
    await expect(page.getByText('위치 및 관리 정보')).toBeVisible();
    await expect(termExact(page, '사이트')).toBeVisible();
    await expect(termExact(page, '팀')).toBeVisible();
    await expect(termExact(page, '보관 위치')).toBeVisible();
  });
});
