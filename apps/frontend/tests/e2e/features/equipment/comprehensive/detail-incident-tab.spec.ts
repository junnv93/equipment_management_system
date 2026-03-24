/**
 * 장비 상세 - 사고 이력 탭 테스트 (Part E)
 *
 * E-1: 사고 이력 CRUD
 * - 사고 유형 5개: damage, malfunction, change, repair, calibration_overdue
 * - damage/malfunction → "부적합으로 등록" 체크박스 표시
 * - change/repair → 체크박스 미표시
 * - 역할별 등록/삭제 권한
 *
 * Auth Fixtures:
 * - techManagerPage: 등록+삭제 가능
 * - testOperatorPage: 등록 가능, 삭제 불가
 * - qualityManagerPage: 등록+삭제 모두 불가
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { TEST_EQUIPMENT_IDS } from '../../../shared/constants/shared-test-data';

const EQUIPMENT_ID = TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E; // available

test.describe('장비 상세 - 사고 이력 탭', () => {
  test.describe('E-1: 사고 이력 탭 렌더링', () => {
    test('사고 이력 탭으로 이동하면 타임라인이 표시된다', async ({ techManagerPage: page }) => {
      await page.goto(`/equipment/${EQUIPMENT_ID}?tab=incident`);

      // 사고 이력 제목 확인
      await expect(page.getByText(/사고 이력/).first()).toBeVisible({ timeout: 15000 });
    });

    test('TM은 사고 이력 등록 버튼이 보인다', async ({ techManagerPage: page }) => {
      await page.goto(`/equipment/${EQUIPMENT_ID}?tab=incident`);

      await expect(page.getByText(/사고 이력/).first()).toBeVisible({ timeout: 15000 });

      // DialogTrigger 안의 등록 버튼
      const registerButton = page.getByRole('button', { name: /등록/ }).first();
      await expect(registerButton).toBeVisible();
    });

    test('TE도 사고 이력 등록 버튼이 보인다', async ({ testOperatorPage: page }) => {
      await page.goto(`/equipment/${EQUIPMENT_ID}?tab=incident`);

      await expect(page.getByText(/사고 이력/).first()).toBeVisible({ timeout: 15000 });

      const registerButton = page.getByRole('button', { name: /등록/ }).first();
      await expect(registerButton).toBeVisible();
    });

    test('QM은 사고 이력 등록 버튼이 보이지 않는다', async ({ qualityManagerPage: page }) => {
      await page.goto(`/equipment/${EQUIPMENT_ID}?tab=incident`);

      await expect(page.getByText(/사고 이력/).first()).toBeVisible({ timeout: 15000 });

      // canCreate=false → RegisterDialog 미렌더링, 등록 텍스트를 포함하는 버튼이 없어야 함
      // 사고 이력 카드 내부에서만 확인
      const incidentCard = page
        .locator('[class*="card"]')
        .filter({ hasText: /사고 이력/ })
        .first();
      const registerButtons = incidentCard.getByRole('button', { name: /등록/ });
      await expect(registerButtons).toHaveCount(0);
    });
  });

  test.describe('E-1: 사고 이력 등록 다이얼로그', () => {
    test('등록 다이얼로그에서 유형 선택 드롭다운이 표시된다', async ({ techManagerPage: page }) => {
      await page.goto(`/equipment/${EQUIPMENT_ID}?tab=incident`);

      await expect(page.getByText(/사고 이력/).first()).toBeVisible({ timeout: 15000 });

      // 등록 버튼 클릭 → 다이얼로그 열림
      await page.getByRole('button', { name: /등록/ }).first().click();

      // 다이얼로그 표시 확인
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // 유형 선택 셀렉트 트리거 확인 (shadcn Select)
      const selectTrigger = dialog.locator('button[role="combobox"]').first();
      await expect(selectTrigger).toBeVisible();
    });

    test('damage 유형 선택 시 부적합 등록 체크박스가 표시된다', async ({
      techManagerPage: page,
    }) => {
      await page.goto(`/equipment/${EQUIPMENT_ID}?tab=incident`);

      await expect(page.getByText(/사고 이력/).first()).toBeVisible({ timeout: 15000 });
      await page.getByRole('button', { name: /등록/ }).first().click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // shadcn Select 트리거 클릭 (유형 선택)
      const selectTrigger = dialog.locator('button[role="combobox"]').first();
      await selectTrigger.click();

      // 손상 옵션 선택
      await page.getByRole('option', { name: '손상' }).click();

      // 발생 일시, 내용 필드 확인
      await expect(dialog.getByText(/발생 일시/)).toBeVisible();
      await expect(dialog.getByText('내용')).toBeVisible();

      // 부적합 등록 체크박스 확인 (damage 유형)
      const ncCheckbox = dialog.getByText(/부적합으로 등록/);
      await expect(ncCheckbox.first()).toBeVisible();
    });

    test('change 유형 선택 시 부적합 등록 체크박스가 표시되지 않는다', async ({
      techManagerPage: page,
    }) => {
      await page.goto(`/equipment/${EQUIPMENT_ID}?tab=incident`);

      await expect(page.getByText(/사고 이력/).first()).toBeVisible({ timeout: 15000 });
      await page.getByRole('button', { name: /등록/ }).first().click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // 유형 선택: 변경
      const selectTrigger = dialog.locator('button[role="combobox"]').first();
      await selectTrigger.click();
      await page.getByRole('option', { name: '변경' }).click();

      // 발생 일시, 내용 필드 확인
      await expect(dialog.getByText(/발생 일시/)).toBeVisible();

      // 부적합 등록 체크박스가 없어야 함 (change 유형)
      const ncCheckbox = dialog.getByText(/부적합으로 등록/);
      await expect(ncCheckbox).not.toBeVisible();
    });

    test('repair 유형 선택 시 수리 이력 폼이 표시된다', async ({ techManagerPage: page }) => {
      await page.goto(`/equipment/${EQUIPMENT_ID}?tab=incident`);

      await expect(page.getByText(/사고 이력/).first()).toBeVisible({ timeout: 15000 });
      await page.getByRole('button', { name: /등록/ }).first().click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // 유형 선택: 수리
      const selectTrigger = dialog.locator('button[role="combobox"]').first();
      await selectTrigger.click();
      await page.getByRole('option', { name: '수리' }).click();

      // 수리 이력 전용 폼 필드 확인 — 수리 폼은 별도 Form 컴포넌트
      // 날짜 입력 + textarea가 수리 폼 내에 표시됨
      await expect(dialog.locator('input[type="date"]')).toBeVisible();
      await expect(dialog.locator('textarea').first()).toBeVisible();
    });

    test('malfunction 유형 선택 시 부적합 등록 체크박스가 표시된다', async ({
      techManagerPage: page,
    }) => {
      await page.goto(`/equipment/${EQUIPMENT_ID}?tab=incident`);

      await expect(page.getByText(/사고 이력/).first()).toBeVisible({ timeout: 15000 });
      await page.getByRole('button', { name: /등록/ }).first().click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // 유형 선택: 오작동
      const selectTrigger = dialog.locator('button[role="combobox"]').first();
      await selectTrigger.click();
      await page.getByRole('option', { name: '오작동' }).click();

      // 부적합 등록 체크박스 확인 (malfunction 유형)
      const ncCheckbox = dialog.getByText(/부적합으로 등록/);
      await expect(ncCheckbox.first()).toBeVisible();
    });
  });

  test.describe('E-1: 사고 이력 등록 실행', () => {
    test.describe.configure({ mode: 'serial' });

    test('damage 유형 사고 이력을 등록할 수 있다', async ({ techManagerPage: page }) => {
      await page.goto(`/equipment/${EQUIPMENT_ID}?tab=incident`);

      await expect(page.getByText(/사고 이력/).first()).toBeVisible({ timeout: 15000 });
      await page.getByRole('button', { name: /등록/ }).first().click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // 유형 선택: 손상
      const selectTrigger = dialog.locator('button[role="combobox"]').first();
      await selectTrigger.click();
      await page.getByRole('option', { name: '손상' }).click();

      // 내용 입력
      const contentField = dialog.locator('textarea').first();
      await contentField.fill('E2E 테스트: 낙하로 인한 외부 손상 발생');

      // 저장 버튼 클릭
      const saveButton = dialog.getByRole('button', { name: /저장|등록/ }).last();
      await saveButton.click();

      // 다이얼로그 닫힘 확인 (성공 시)
      await expect(dialog).not.toBeVisible({ timeout: 10000 });

      // 새로 등록된 이력이 타임라인에 표시되는지 확인
      await expect(page.getByText('E2E 테스트: 낙하로 인한 외부 손상 발생')).toBeVisible({
        timeout: 10000,
      });
    });
  });
});
