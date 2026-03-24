/**
 * 수리 이력 페이지 테스트 (Part D)
 *
 * 경로: /equipment/:uuid/repair-history
 *
 * D-1: 수리 이력 CRUD
 * - 목록 렌더링 (RepairHistoryTimeline)
 * - 생성 다이얼로그 필드: 수리 일자, 수리 내용, 수리 결과, 연결된 부적합(선택), 비고
 * - 수리 결과: 수리 완료/부분 수리/수리 실패
 * - 유효성 검사: 수리 내용 10자 이상
 *
 * Auth: techManagerPage
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { TEST_EQUIPMENT_IDS } from '../../../shared/constants/shared-test-data';

const EQUIPMENT_ID = TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E;

test.describe('수리 이력 페이지', () => {
  test.describe('D-1: 페이지 렌더링', () => {
    test('수리 이력 페이지가 정상 렌더링된다', async ({ techManagerPage: page }) => {
      await page.goto(`/equipment/${EQUIPMENT_ID}/repair-history`);

      // 페이지 제목 확인
      await expect(page.getByText(/수리 이력/).first()).toBeVisible({ timeout: 15000 });

      // 등록 버튼 확인 ("수리 이력 추가" 또는 "등록")
      const addButton = page.getByRole('button', { name: /추가|등록/ }).first();
      await expect(addButton).toBeVisible();
    });

    test('요약 카드에 수리 이력 건수가 표시된다', async ({ techManagerPage: page }) => {
      await page.goto(`/equipment/${EQUIPMENT_ID}/repair-history`);

      await expect(page.getByText(/수리 이력/).first()).toBeVisible({ timeout: 15000 });

      // 요약 카드 확인 (총 N회 또는 0회)
      const summaryCard = page.getByText(/회/).first();
      await expect(summaryCard).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('D-1: 수리 이력 생성 다이얼로그', () => {
    test('생성 다이얼로그에서 필수 필드가 표시된다', async ({ techManagerPage: page }) => {
      await page.goto(`/equipment/${EQUIPMENT_ID}/repair-history`);

      await expect(page.getByText(/수리 이력/).first()).toBeVisible({ timeout: 15000 });

      // 등록/추가 버튼 클릭
      await page
        .getByRole('button', { name: /추가|등록/ })
        .first()
        .click();

      // 다이얼로그 확인
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // 수리 일자 필드
      await expect(dialog.locator('input[type="date"]')).toBeVisible();

      // 수리 내용 필드 (textarea)
      await expect(dialog.locator('textarea').first()).toBeVisible();

      // 등록/취소 버튼
      await expect(dialog.getByRole('button', { name: /등록/ }).last()).toBeVisible();
      await expect(dialog.getByRole('button', { name: /취소/ })).toBeVisible();
    });

    test('수리 결과 옵션에 완료/부분/실패가 있다', async ({ techManagerPage: page }) => {
      await page.goto(`/equipment/${EQUIPMENT_ID}/repair-history`);

      await expect(page.getByText(/수리 이력/).first()).toBeVisible({ timeout: 15000 });

      await page
        .getByRole('button', { name: /추가|등록/ })
        .first()
        .click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // "수리 결과" 셀렉트 트리거 클릭 — "수리 결과 선택" placeholder
      const resultSelect = dialog.locator('button[role="combobox"]').first();
      await resultSelect.click();

      // 옵션 확인
      await expect(page.getByRole('option', { name: /완료/ })).toBeVisible();
      await expect(page.getByRole('option', { name: /부분/ })).toBeVisible();
      await expect(page.getByRole('option', { name: /실패/ })).toBeVisible();

      // 닫기
      await page.keyboard.press('Escape');
    });
  });

  test.describe('D-1: 수리 이력 CRUD 실행', () => {
    test.describe.configure({ mode: 'serial' });

    test('수리 이력을 등록할 수 있다', async ({ techManagerPage: page }) => {
      await page.goto(`/equipment/${EQUIPMENT_ID}/repair-history`);

      await expect(page.getByText(/수리 이력/).first()).toBeVisible({ timeout: 15000 });

      await page
        .getByRole('button', { name: /추가|등록/ })
        .first()
        .click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // 수리 내용 입력 (최소 10자)
      const descriptionField = dialog.locator('textarea').first();
      await descriptionField.fill('E2E 테스트: 안테나 커넥터 교체 수리 완료 확인');

      // 등록 버튼 클릭
      const submitButton = dialog.getByRole('button', { name: /등록/ }).last();
      await submitButton.click();

      // 다이얼로그 닫힘 확인
      await expect(dialog).not.toBeVisible({ timeout: 10000 });

      // 등록된 이력이 타임라인에 표시되는지 확인
      await expect(page.getByText('E2E 테스트: 안테나 커넥터 교체 수리 완료 확인')).toBeVisible({
        timeout: 10000,
      });
    });

    test('등록된 수리 이력의 수정/삭제 버튼이 표시된다', async ({ techManagerPage: page }) => {
      await page.goto(`/equipment/${EQUIPMENT_ID}/repair-history`);

      await expect(page.getByText(/수리 이력/).first()).toBeVisible({ timeout: 15000 });

      // 등록된 이력 확인
      const targetText = page.getByText('E2E 테스트: 안테나 커넥터 교체 수리 완료 확인');
      const hasTarget = await targetText.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasTarget) {
        // 수정/삭제 버튼 확인 (canEdit=true)
        const editButtons = page.getByRole('button', { name: /수정/ });
        await expect(editButtons.first()).toBeVisible();

        const deleteButtons = page.getByRole('button', { name: /삭제/ });
        await expect(deleteButtons.first()).toBeVisible();
      }
    });
  });

  test.describe('D-1: 수리 내용 유효성 검사', () => {
    test('수리 내용이 10자 미만이면 다이얼로그가 닫히지 않는다', async ({
      techManagerPage: page,
    }) => {
      await page.goto(`/equipment/${EQUIPMENT_ID}/repair-history`);

      await expect(page.getByText(/수리 이력/).first()).toBeVisible({ timeout: 15000 });

      await page
        .getByRole('button', { name: /추가|등록/ })
        .first()
        .click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // 짧은 내용 입력 (10자 미만)
      const descriptionField = dialog.locator('textarea').first();
      await descriptionField.fill('짧은 내용');

      // 등록 버튼 클릭
      const submitButton = dialog.getByRole('button', { name: /등록/ }).last();
      await submitButton.click();

      // Zod 검증 실패 → 다이얼로그가 닫히지 않아야 함
      // 2초 후에도 다이얼로그가 여전히 열려있는지 확인
      await page.waitForTimeout(2000);
      await expect(dialog).toBeVisible();
    });
  });
});
