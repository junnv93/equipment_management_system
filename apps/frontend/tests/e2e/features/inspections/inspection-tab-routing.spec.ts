/**
 * 장비 상세 점검 탭 분기 렌더링 E2E 테스트
 *
 * 교정 대상 장비(calibrationRequired='required')는 중간점검(UL-QP-18-03) UI,
 * 비교정 대상 장비(calibrationRequired='not_required')는 자체점검(UL-QP-18-05) UI를 표시.
 *
 * @see docs/workflows/critical-workflows.md WF-19, WF-20
 */

import { test, expect } from '../../shared/fixtures/auth.fixture';
import { TEST_EQUIPMENT_IDS } from '../../shared/constants/shared-test-data';

/** 교정 대상 장비 — 중간점검 UI 표시 */
const CALIBRATED_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E;

/** 자체점검 대상 장비 (managementMethod: self_inspection) — 자체점검 UI 표시 */
const SELF_INSPECTION_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.MULTIMETER_SUW_R;

test.describe('점검 탭 분기 렌더링', () => {
  test('교정 대상 장비 → 점검 탭에 중간점검 UI 표시', async ({ testOperatorPage: page }) => {
    await page.goto(`/equipment/${CALIBRATED_EQUIPMENT_ID}?tab=inspection`);

    // 중간점검 제목 확인 — 제목과 양식 번호 배지를 분리 매칭
    // (양식 번호는 FormNumberBadge가 런타임에 DB에서 조회하므로 i18n 하드코딩 없음)
    await expect(page.getByRole('heading', { name: /중간점검 기록/ }).first()).toBeVisible({
      timeout: 15000,
    });

    // "점검 기록 작성" 버튼 존재
    await expect(page.getByRole('button', { name: '점검 기록 작성' })).toBeVisible();

    // 자체점검 관련 UI는 표시되지 않아야 함
    await expect(page.getByText('자체점검 이력')).not.toBeVisible();
  });

  test('비교정 대상 장비 → 점검 탭에 자체점검 UI + 생성 버튼 표시', async ({
    testOperatorPage: page,
  }) => {
    await page.goto(`/equipment/${SELF_INSPECTION_EQUIPMENT_ID}?tab=inspection`);

    // 자체점검 제목 확인
    await expect(page.getByText('자체점검 이력')).toBeVisible({ timeout: 15000 });

    // 생성 버튼 존재
    await expect(page.getByRole('button', { name: '점검 기록 작성' })).toBeVisible();

    // 중간점검 관련 UI는 표시되지 않아야 함
    await expect(page.getByRole('heading', { name: /중간점검 기록/ })).not.toBeVisible();
  });

  test('?tab=self-inspection URL → ?tab=inspection으로 하위 호환', async ({
    testOperatorPage: page,
  }) => {
    await page.goto(`/equipment/${CALIBRATED_EQUIPMENT_ID}?tab=self-inspection`);

    // 리다이렉트 후 점검 탭 콘텐츠가 렌더링되어야 함
    await expect(
      page
        .getByRole('heading', { name: /중간점검 기록/ })
        .or(page.getByText('자체점검 이력'))
        .first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('교정 페이지에 점검 관련 탭이 없어야 함', async ({ testOperatorPage: page }) => {
    await page.goto('/calibration');

    // 페이지 로딩 대기 — heading으로 특정
    await expect(page.getByRole('heading', { name: '교정 관리' })).toBeVisible({ timeout: 15000 });

    // 중간점검/자체점검 탭이 제거되었는지 확인
    await expect(page.getByRole('tab', { name: /중간점검/ })).not.toBeVisible();
    await expect(page.getByRole('tab', { name: /자체점검/ })).not.toBeVisible();
  });
});
