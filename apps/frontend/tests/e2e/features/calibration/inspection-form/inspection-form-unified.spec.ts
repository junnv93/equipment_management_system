/**
 * 중간점검 폼 통합 워크플로우 (1-Step UX)
 *
 * 테스트 대상:
 * - 장비 상세 → 점검 탭 → "점검 기록 작성" 다이얼로그
 * - 장비 마스터 데이터에서 자동 prefill (점검주기, 교정유효기간)
 * - 프리셋 선택 → 점검 항목 자동 입력
 * - 직접 입력으로 항목 추가
 * - 폼 제출 → 성공 토스트 확인
 *
 * ## SSOT 준수
 * - auth.fixture.ts: testOperatorPage (시험실무자 — 점검 생성 권한)
 * - shared-test-data.ts: TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { TEST_EQUIPMENT_IDS } from '../../../shared/constants/shared-test-data';

const EQUIPMENT_ID = TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E;

/** 장비 점검 탭으로 이동하고 폼 다이얼로그를 여는 공통 헬퍼 */
async function openInspectionForm(page: import('@playwright/test').Page) {
  await page.goto(`/equipment/${EQUIPMENT_ID}?tab=inspection`);
  await expect(page.locator('[role="tablist"]').first()).toBeVisible({ timeout: 15000 });

  const createButton = page.getByRole('button', { name: /점검 기록 작성/ });
  await expect(createButton).toBeVisible({ timeout: 10000 });
  await createButton.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 5000 });
  return dialog;
}

test.describe('중간점검 폼 통합 (1-Step UX)', () => {
  test('1. 점검 탭에서 "점검 기록 작성" 클릭 시 다이얼로그가 열린다', async ({
    testOperatorPage: page,
  }) => {
    const dialog = await openInspectionForm(page);
    await expect(dialog.getByText('중간점검 기록')).toBeVisible();
  });

  test('2. 다이얼로그에서 prefill 필드와 측정 결과 데이터 섹션이 표시된다', async ({
    testOperatorPage: page,
  }) => {
    const dialog = await openInspectionForm(page);

    // 점검주기, 교정유효기간 필드가 존재하는지 확인
    await expect(dialog.getByText('점검 주기')).toBeVisible();
    await expect(dialog.getByText('교정 유효기간')).toBeVisible();

    // 섹션 추가 버튼이 있는지 확인 (측정 결과 데이터 영역)
    await expect(dialog.getByRole('button', { name: /섹션 추가/ })).toBeVisible();
  });

  test('3. 프리셋 선택 시 점검 항목이 자동 추가된다', async ({ testOperatorPage: page }) => {
    const dialog = await openInspectionForm(page);

    // 프리셋 Select 트리거 클릭 (combobox 중 프리셋용 — 항목 추가 버튼 옆)
    const presetCombobox = dialog.locator('button[role="combobox"]').nth(1);
    await presetCombobox.click();

    // "외관 검사" 프리셋 선택
    const presetOption = page.getByRole('option', { name: '외관 검사' });
    await expect(presetOption).toBeVisible({ timeout: 5000 });
    await presetOption.click();

    // 점검 항목이 추가되었는지 확인 (#1 항목)
    await expect(dialog.getByText('#1')).toBeVisible();

    // checkItem 필드에 "외관 검사" 텍스트가 채워졌는지 확인
    const checkItemInput = dialog.locator('input[value="외관 검사"]');
    await expect(checkItemInput).toBeVisible();

    // checkCriteria 필드에 "마모 상태 확인" 텍스트가 채워졌는지 확인
    const checkCriteriaInput = dialog.locator('input[value="마모 상태 확인"]');
    await expect(checkCriteriaInput).toBeVisible();
  });

  test('4. "항목 추가" 버튼으로 직접 입력 항목을 추가할 수 있다', async ({
    testOperatorPage: page,
  }) => {
    const dialog = await openInspectionForm(page);

    // "항목 추가" 버튼 클릭
    const addButton = dialog.getByRole('button', { name: /항목 추가/ });
    await addButton.click();

    // 빈 항목이 추가됨 (#1)
    await expect(dialog.getByText('#1')).toBeVisible();
  });

  test('5. 완전한 폼 제출 — 점검 + 항목을 한번에 생성한다', async ({ testOperatorPage: page }) => {
    const dialog = await openInspectionForm(page);

    // 1. 점검일 입력
    const today = new Date().toISOString().split('T')[0];
    const dateInput = dialog.locator('input[type="date"]');
    await dateInput.fill(today);

    // 2. 프리셋으로 항목 추가 (combobox nth(1) = 프리셋 Select)
    const presetCombobox = dialog.locator('button[role="combobox"]').nth(1);
    await presetCombobox.click();
    const presetOption = page.getByRole('option', { name: '외관 검사' });
    await expect(presetOption).toBeVisible({ timeout: 5000 });
    await presetOption.click();

    // 3. 비고 입력
    const remarksTextarea = dialog.locator('textarea');
    await remarksTextarea.fill('E2E 테스트 - 1-step 통합 폼');

    // 4. 저장 버튼 클릭
    const saveButton = dialog.getByRole('button', { name: '저장' });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // 5. 성공 토스트 확인
    const toast = page.locator('[role="status"]').filter({ hasText: '점검 기록이 생성되었습니다' });
    await expect(toast).toBeVisible({ timeout: 10000 });

    // 6. 다이얼로그 닫힘 확인
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });
});
