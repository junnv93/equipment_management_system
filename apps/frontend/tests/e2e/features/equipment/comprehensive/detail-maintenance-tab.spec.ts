/**
 * 장비 상세 - 유지보수 이력 탭 테스트
 *
 * 유지보수 이력 CRUD:
 * - 탭 렌더링 (타임라인 UI)
 * - 등록 다이얼로그 (수행 일시, 내용)
 * - 역할별 등록/삭제 권한
 *   - TE/TM/LM/SA: 등록 가능
 *   - TM/LM/SA: 삭제 가능
 *   - QM: 등록/삭제 불가
 *
 * Auth Fixtures:
 * - techManagerPage: 등록+삭제
 * - testOperatorPage: 등록만
 * - qualityManagerPage: 읽기 전용
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { TEST_EQUIPMENT_IDS } from '../../../shared/constants/shared-test-data';

const EQUIPMENT_ID = TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E; // available

test.describe('장비 상세 - 유지보수 이력 탭', () => {
  test.describe('탭 렌더링', () => {
    test('유지보수 탭으로 이동하면 유지보수 이력이 표시된다', async ({ techManagerPage: page }) => {
      await page.goto(`/equipment/${EQUIPMENT_ID}?tab=maintenance`);

      // 유지보수 탭 활성화 확인
      const maintenanceTab = page.getByRole('tab', { name: /유지보수/ });
      await expect(maintenanceTab).toBeVisible({ timeout: 15000 });

      // 유지보수 이력 카드 제목 확인
      await expect(page.getByText(/유지보수/).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('역할별 권한', () => {
    test('TM은 유지보수 등록 버튼이 보인다', async ({ techManagerPage: page }) => {
      await page.goto(`/equipment/${EQUIPMENT_ID}?tab=maintenance`);

      await expect(page.getByText(/유지보수/).first()).toBeVisible({ timeout: 15000 });

      const registerButton = page.getByRole('button', { name: /등록/ }).first();
      await expect(registerButton).toBeVisible();
    });

    test('TE도 유지보수 등록 버튼이 보인다', async ({ testOperatorPage: page }) => {
      await page.goto(`/equipment/${EQUIPMENT_ID}?tab=maintenance`);

      await expect(page.getByText(/유지보수/).first()).toBeVisible({ timeout: 15000 });

      const registerButton = page.getByRole('button', { name: /등록/ }).first();
      await expect(registerButton).toBeVisible();
    });

    test('QM은 유지보수 등록 버튼이 보이지 않는다', async ({ qualityManagerPage: page }) => {
      await page.goto(`/equipment/${EQUIPMENT_ID}?tab=maintenance`);

      await expect(page.getByText(/유지보수/).first()).toBeVisible({ timeout: 15000 });

      // canCreate=false → RegisterDialog 미렌더링
      // 등록 관련 버튼이 없어야 함
      const registerButton = page.getByRole('button', { name: /등록/ });
      const count = await registerButton.count();
      // 페이지에 등록 버튼이 보이지 않아야 함
      for (let i = 0; i < count; i++) {
        const isVisible = await registerButton.nth(i).isVisible();
        if (isVisible) {
          // 유지보수 탭 내 등록 버튼이 아님을 확인
          const parentCard = registerButton
            .nth(i)
            .locator('xpath=ancestor::*[contains(@class, "card")]')
            .first();
          const cardText = await parentCard.textContent().catch(() => '');
          expect(cardText).not.toContain('유지보수');
        }
      }
    });
  });

  test.describe('등록 다이얼로그', () => {
    test('등록 다이얼로그에서 수행 일시와 내용을 입력할 수 있다', async ({
      techManagerPage: page,
    }) => {
      await page.goto(`/equipment/${EQUIPMENT_ID}?tab=maintenance`);

      await expect(page.getByText(/유지보수/).first()).toBeVisible({ timeout: 15000 });

      // 등록 버튼 클릭
      await page.getByRole('button', { name: /등록/ }).first().click();

      // 다이얼로그 표시 확인
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // 다이얼로그 제목 확인
      await expect(dialog.getByText(/유지보수.*등록|유지보수.*추가/)).toBeVisible();

      // 수행 일시 필드 확인
      await expect(dialog.getByText(/수행 일시|수행일/)).toBeVisible();
      const dateInput = dialog.locator('input[type="date"]');
      await expect(dateInput).toBeVisible();

      // 내용 필드 확인
      await expect(dialog.getByText(/내용/)).toBeVisible();
      const contentField = dialog.locator('textarea');
      await expect(contentField).toBeVisible();

      // 저장/취소 버튼 확인
      await expect(dialog.getByRole('button', { name: /저장|등록/ }).last()).toBeVisible();
      await expect(dialog.getByRole('button', { name: /취소/ })).toBeVisible();
    });
  });

  test.describe('등록 실행', () => {
    test.describe.configure({ mode: 'serial' });

    test('유지보수 이력을 등록할 수 있다', async ({ techManagerPage: page }) => {
      await page.goto(`/equipment/${EQUIPMENT_ID}?tab=maintenance`);

      await expect(page.getByText(/유지보수/).first()).toBeVisible({ timeout: 15000 });

      // 등록 버튼 클릭
      await page.getByRole('button', { name: /등록/ }).first().click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // 내용 입력
      const contentField = dialog.locator('textarea').first();
      await contentField.fill('E2E 테스트: 정기 유지보수 수행');

      // 저장 버튼 클릭
      const saveButton = dialog.getByRole('button', { name: /저장|등록/ }).last();
      await saveButton.click();

      // 다이얼로그 닫힘 확인
      await expect(dialog).not.toBeVisible({ timeout: 10000 });

      // 등록된 이력이 타임라인에 표시되는지 확인
      await expect(page.getByText('E2E 테스트: 정기 유지보수 수행')).toBeVisible({
        timeout: 10000,
      });
    });
  });
});
