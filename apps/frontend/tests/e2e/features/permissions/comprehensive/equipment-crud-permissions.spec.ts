/**
 * 역할별 권한 통합 E2E — 시나리오 5: 장비 관리 CRUD 권한
 *
 * 장비 상세 페이지의 액션 버튼 가시성을 역할별로 검증합니다.
 *
 * 주요 버튼 (EquipmentStickyHeader.tsx):
 * - 반출 신청: status 기반 (역할 무관, 권한은 백엔드 검증)
 * - 수정: status ≠ retired (역할 무관)
 * - 삭제: LAB_MANAGER/SYSTEM_ADMIN + 미승인/반려 상태
 * - 폐기 요청: useDisposalPermissions() hook (역할+상태 기반)
 *
 * 교정 등록 (CalibrationContent.tsx):
 * - CREATE_CALIBRATION 권한: TE, TM만 표시
 * - LM은 교정 등록 불가 (UL-QP-18 직무분리)
 *
 * spec: apps/frontend/tests/e2e/features/permissions/comprehensive/role-permissions.plan.md
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { TEST_EQUIPMENT_IDS } from '../../../shared/constants/shared-test-data';

// available 상태 장비 사용 (반출 신청 버튼이 보이는 상태)
const AVAILABLE_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E;

test.describe('시나리오 5: 장비 관리 CRUD 권한', () => {
  test('TC-18: TE — 장비 상세에서 수정/반출 신청 가능', async ({ testOperatorPage: page }) => {
    await page.goto(`/equipment/${AVAILABLE_EQUIPMENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 수정 버튼 표시 (available 상태)
    await expect(page.getByRole('link', { name: '수정' })).toBeVisible();

    // 반출 신청 버튼 표시 (available 상태)
    await expect(page.getByRole('link', { name: '반출 신청' })).toBeVisible();
  });

  test('TC-19: TM — 장비 상세에서 수정/반출 신청 가능', async ({ techManagerPage: page }) => {
    await page.goto(`/equipment/${AVAILABLE_EQUIPMENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 수정 버튼 표시
    await expect(page.getByRole('link', { name: '수정' })).toBeVisible();

    // 반출 신청 버튼 표시
    await expect(page.getByRole('link', { name: '반출 신청' })).toBeVisible();
  });

  test('TC-20: LM — 장비 상세에서 수정/반출 신청 가능', async ({ siteAdminPage: page }) => {
    await page.goto(`/equipment/${AVAILABLE_EQUIPMENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 수정 버튼 표시
    await expect(page.getByRole('link', { name: '수정' })).toBeVisible();

    // 반출 신청 버튼 표시
    await expect(page.getByRole('link', { name: '반출 신청' })).toBeVisible();
  });

  test('TC-21: 교정 등록 — TE/TM 가능, LM 불가 (직무분리)', async ({
    testOperatorPage: tePage,
    techManagerPage: tmPage,
    siteAdminPage: lmPage,
  }) => {
    // TE: 교정 등록 버튼 표시
    await tePage.goto('/calibration');
    await expect(tePage.locator('main')).toBeVisible({ timeout: 10000 });
    await expect(tePage.getByRole('button', { name: '교정 정보 등록' })).toBeVisible();

    // TM: 교정 등록 버튼 표시
    await tmPage.goto('/calibration');
    await expect(tmPage.locator('main')).toBeVisible({ timeout: 10000 });
    await expect(tmPage.getByRole('button', { name: '교정 정보 등록' })).toBeVisible();

    // LM: 교정 등록 버튼 숨김 (CREATE_CALIBRATION 권한 없음 — UL-QP-18 직무분리)
    await lmPage.goto('/calibration');
    await expect(lmPage.locator('main')).toBeVisible({ timeout: 10000 });
    await expect(lmPage.getByRole('button', { name: '교정 정보 등록' })).not.toBeVisible();
  });

  test('TC-22: QM — 교정 등록 버튼 숨김', async ({ qualityManagerPage: page }) => {
    await page.goto('/calibration');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    // QM: CREATE_CALIBRATION 권한 없음
    await expect(page.getByRole('button', { name: '교정 정보 등록' })).not.toBeVisible();
  });
});
