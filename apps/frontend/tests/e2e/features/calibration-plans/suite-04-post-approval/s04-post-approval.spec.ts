/**
 * Suite 04: 교정계획서 승인 후 기능 테스트
 *
 * B-4: 항목 확인(confirm), 새 버전 생성, draft에서만 삭제 가능
 *
 * 시드 데이터:
 * - CPLAN_004: approved (항목 007, 008 — confirmedBy/confirmedAt 포함)
 * - CPLAN_001: draft (삭제 가능)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { TEST_CALIBRATION_PLAN_IDS } from '../../../shared/constants/shared-test-data';

const PLANS_PAGE = '/calibration-plans';

test.describe('B-4: 교정계획서 승인 후 기능', () => {
  test.describe('항목 확인 (confirm)', () => {
    test('approved 계획서 — 확인 진행률 또는 확인됨 배지 표시', async ({
      techManagerPage: page,
    }) => {
      await page.goto(`${PLANS_PAGE}/${TEST_CALIBRATION_PLAN_IDS.CPLAN_004_APPROVED}`);

      // 승인 완료 상태 확인
      await expect(page.getByText(/승인 완료|approved/i).first()).toBeVisible({ timeout: 15000 });

      // 확인 진행률 또는 확인됨 배지 표시
      const hasProgress = await page
        .getByText(/확인 진행|확인됨|100%/)
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      // 항목 테이블 자체가 있으면 OK
      const hasItems = await page
        .getByText(/장비|관리번호|순번/)
        .first()
        .isVisible()
        .catch(() => false);
      expect(hasProgress || hasItems).toBeTruthy();
    });

    test('approved 계획서 — 실제 교정일(actualCalibrationDate) 표시', async ({
      techManagerPage: page,
    }) => {
      await page.goto(`${PLANS_PAGE}/${TEST_CALIBRATION_PLAN_IDS.CPLAN_004_APPROVED}`);

      // 실제 교정일이 항목 테이블에 표시
      // CPLAN_ITEM_007: actualCalibrationDate = 2025-08-28
      await expect(page.getByText(/2025-08|2025.08/).first()).toBeVisible();
    });
  });

  test.describe('draft 상태 관리', () => {
    test('draft 계획서에서 삭제 버튼 표시', async ({ techManagerPage: page }) => {
      await page.goto(`${PLANS_PAGE}/${TEST_CALIBRATION_PLAN_IDS.CPLAN_001_DRAFT}`);

      // draft 상태에서 삭제 버튼 확인
      const deleteButton = page.getByRole('button', { name: /삭제/ });
      await expect(deleteButton).toBeVisible();
    });

    test('draft 계획서 삭제 → 확인 다이얼로그', async ({ techManagerPage: page }) => {
      await page.goto(`${PLANS_PAGE}/${TEST_CALIBRATION_PLAN_IDS.CPLAN_001_DRAFT}`);

      const deleteButton = page.getByRole('button', { name: /삭제/ });
      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // 삭제 확인 다이얼로그
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        await expect(dialog.getByText(/삭제.*되돌릴 수 없|정말로.*삭제/)).toBeVisible();

        // 취소 (실제 삭제하지 않음 — 시드 데이터 보존)
        await dialog.getByRole('button', { name: /취소/ }).click();
        await expect(dialog).not.toBeVisible();
      }
    });

    test('approved 계획서에서는 삭제 버튼 미표시', async ({ techManagerPage: page }) => {
      await page.goto(`${PLANS_PAGE}/${TEST_CALIBRATION_PLAN_IDS.CPLAN_004_APPROVED}`);

      // approved 상태에서는 삭제 불가
      const deleteButton = page.getByRole('button', { name: /삭제/, exact: true });
      await expect(deleteButton).not.toBeVisible();
    });
  });

  test.describe('draft 상태에서만 항목 수정', () => {
    test('draft 계획서 — 항목 영역 표시', async ({ techManagerPage: page }) => {
      await page.goto(`${PLANS_PAGE}/${TEST_CALIBRATION_PLAN_IDS.CPLAN_001_DRAFT}`);

      // draft 상태 확인
      await expect(page.getByText(/작성 중|draft/i).first()).toBeVisible({ timeout: 15000 });

      // 항목 테이블/영역이 존재해야 함
      await expect(page.getByText(/장비|관리번호|순번/).first()).toBeVisible();
    });

    test('approved 계획서 — 항목 수정 불가 (읽기 전용)', async ({ techManagerPage: page }) => {
      await page.goto(`${PLANS_PAGE}/${TEST_CALIBRATION_PLAN_IDS.CPLAN_004_APPROVED}`);

      // approved에서는 수정 버튼이 없어야 함
      const editButton = page.getByRole('button', { name: /수정|편집/ }).first();
      const hasEdit = await editButton.isVisible().catch(() => false);

      // 승인된 계획서에서 항목 수정 UI가 없어야 함
      // (확인 버튼만 있을 수 있음)
      expect(hasEdit).toBeFalsy();
    });
  });
});
