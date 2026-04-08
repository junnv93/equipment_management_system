/**
 * WF-20 UI: 자체점검 수정/확인/삭제 사용자 동선 (UL-QP-18-05)
 *
 * 기존 `wf-20-self-inspection-confirmation.spec.ts` (API 전용) 가 cover하지 못하는
 * 사용자 UI 동선을 검증한다:
 *
 *   장비 상세 점검 탭 진입 → 자체점검 폼 작성 → 행별 수정 다이얼로그 →
 *   TM 확인 처리 → confirmed 후 액션 버튼 사라짐
 *
 * 설계 메모:
 * - 진입점: /equipment/{id}?tab=inspection — InspectionTab 이 management_method
 *   == 'self_inspection' 인 장비에 대해 SelfInspectionTab 을 렌더한다.
 * - TE 는 CREATE_SELF_INSPECTION 보유 (수정/삭제), CONFIRM_SELF_INSPECTION 미보유.
 * - TM 은 양쪽 모두 보유. afterAll 은 API 로 정리한다 (UI 삭제는 confirmed 후 불가).
 *
 * @see docs/workflows/critical-workflows.md WF-20
 */

import type { Locator } from '@playwright/test';
import { test, expect, type Page } from '../shared/fixtures/auth.fixture';
import {
  resetSelfInspections,
  cleanupSharedPool,
  clearBackendCache,
} from './helpers/workflow-helpers';
import { TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';

/**
 * 장비 상세 페이지는 sticky header + 통계 카드가 일반 click의 액션 가능성을
 * 차단한다. 로케이터로 정확히 식별한 뒤 force click을 사용한다.
 */
async function safeClick(page: Page, locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  // sticky header 아래로 추가 스크롤 (페이지 좌표계 보정)
  await page.evaluate(() => window.scrollBy(0, -80));
  await locator.click({ force: true });
}

// FILTER_SUW_E (SUW-E0006, suwon, self_inspection): TRANSMITTER_UIW_W는
// management_method가 external_calibration이라 InspectionTab이 중간점검 UI를 렌더한다.
// 이 spec은 SelfInspectionTab UI를 검증하므로 self_inspection 장비가 필요.
const WF_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.FILTER_SUW_E;
const today = new Date().toISOString().split('T')[0];

// i18n labels (apps/frontend/messages/ko/equipment.json — selfInspection.*)
const L = {
  createButton: '점검 기록 작성',
  formTitle: '자체점검 기록 작성',
  editTitle: '자체점검 기록 수정',
  selectResult: '종합결과 선택',
  pass: '적합',
  saveButton: '저장',
  updateButton: '수정 저장',
  createSuccess: '자체점검 기록이 생성되었습니다.',
  updateSuccess: '자체점검 기록이 수정되었습니다.',
  confirmSuccess: '자체점검이 확인되었습니다.',
  editAction: '수정',
  confirmAction: '확인',
  deleteAction: '삭제',
  confirmDialogTitle: '자체점검 확인',
  confirmDialogAction: '확인 처리',
  statusConfirmed: '확인됨',
  itemNamePlaceholder: '점검 항목명',
  remarksPlaceholder: '비고 사항을 입력하세요',
} as const;

test.describe('WF-20 UI: 자체점검 수정/확인/삭제 동선 (QP-18-05)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await resetSelfInspections(WF_EQUIPMENT_ID);
  });

  test.afterAll(async () => {
    await resetSelfInspections(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('Step 1: TE 점검 탭 진입 → "점검 기록 작성" → 폼 입력 → 저장', async ({
    testOperatorPage: page,
  }) => {
    await clearBackendCache();
    await page.goto(`/equipment/${WF_EQUIPMENT_ID}?tab=inspection`);

    // SelfInspectionTab 헤더 노출 확인 (생성 버튼 가시화)
    await expect(page.getByRole('button', { name: L.createButton })).toBeVisible({
      timeout: 15000,
    });

    await safeClick(page, page.getByRole('button', { name: L.createButton }));

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: L.formTitle })).toBeVisible();

    // 점검일 (date input)
    await dialog.locator('input[type="date"]').first().fill(today);

    // 종합결과 — shadcn Select: 트리거 클릭 후 옵션 선택
    await dialog.getByText(L.selectResult).click();
    // 같은 텍스트가 옵션 + 결과 셀 둘 다 가능 → option role 제한
    await page.getByRole('option', { name: L.pass, exact: true }).click();

    // DEFAULT_SELF_INSPECTION_ITEMS 가 자동 시드. 빈("판정") 트리거가 사라질 때까지
    // 항상 first()를 클릭 — 선택 후 텍스트가 "적합"으로 바뀌면서 필터에서 빠져 인덱스가
    // 어긋나는 문제 회피. 무한루프 방지 가드 포함.
    for (let safety = 0; safety < 20; safety++) {
      const remaining = dialog.getByRole('combobox').filter({ hasText: '판정' });
      if ((await remaining.count()) === 0) break;
      await remaining.first().click();
      await page.getByRole('option', { name: L.pass, exact: true }).first().click();
    }

    await dialog.getByRole('button', { name: L.saveButton }).click();

    await expect(page.getByText(L.createSuccess).first()).toBeVisible({ timeout: 10000 });
    await expect(dialog).toBeHidden();
  });

  test('Step 2: TE 행별 "수정" 버튼 → edit 다이얼로그 → 비고 추가 → 저장', async ({
    testOperatorPage: page,
  }) => {
    await page.goto(`/equipment/${WF_EQUIPMENT_ID}?tab=inspection`);

    // 새로 생성된 행에 수정 버튼 노출
    const editBtn = page.getByRole('button', { name: L.editAction }).first();
    await expect(editBtn).toBeVisible({ timeout: 15000 });
    await safeClick(page, editBtn);

    const dialog = page.getByRole('dialog');
    // 제목이 edit 모드로 바뀜
    await expect(dialog.getByRole('heading', { name: L.editTitle })).toBeVisible();

    // 폼이 기존 값으로 채워졌는지 — date input 비어있지 않음
    const dateInput = dialog.locator('input[type="date"]').first();
    await expect(dateInput).not.toHaveValue('');

    // 비고 추가
    await dialog.getByPlaceholder(L.remarksPlaceholder).fill('WF-20 UI: edit dialog 검증');

    // 버튼 라벨이 "수정 저장" 으로 바뀌었는지
    await dialog.getByRole('button', { name: L.updateButton }).click();

    await expect(page.getByText(L.updateSuccess).first()).toBeVisible({ timeout: 10000 });
    await expect(dialog).toBeHidden();
  });

  test('Step 3: TE에게 "확인" 버튼은 노출되지 않음 (CONFIRM 권한 없음)', async ({
    testOperatorPage: page,
  }) => {
    await page.goto(`/equipment/${WF_EQUIPMENT_ID}?tab=inspection`);

    // 수정 버튼은 보이지만 확인 버튼은 보이지 않음
    await expect(page.getByRole('button', { name: L.editAction }).first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole('button', { name: L.confirmAction })).toHaveCount(0);
  });

  test('Step 4: TM 점검 탭 진입 → "확인" 버튼 → AlertDialog → 확인 처리', async ({
    techManagerPage: page,
  }) => {
    await clearBackendCache();
    await page.goto(`/equipment/${WF_EQUIPMENT_ID}?tab=inspection`);

    const confirmBtn = page.getByRole('button', { name: L.confirmAction }).first();
    await expect(confirmBtn).toBeVisible({ timeout: 15000 });
    await safeClick(page, confirmBtn);

    // AlertDialog (alertdialog role)
    const alert = page.getByRole('alertdialog');
    await expect(alert.getByRole('heading', { name: L.confirmDialogTitle })).toBeVisible();
    await alert.getByRole('button', { name: L.confirmDialogAction }).click();

    await expect(page.getByText(L.confirmSuccess)).toBeVisible({ timeout: 10000 });
  });

  test('Step 5: confirmed 상태 → 수정/확인/삭제 버튼 사라짐', async ({ techManagerPage: page }) => {
    await clearBackendCache();
    await page.goto(`/equipment/${WF_EQUIPMENT_ID}?tab=inspection`);

    // 상태 배지 "확인됨" 노출
    await expect(page.getByText(L.statusConfirmed).first()).toBeVisible({ timeout: 15000 });

    // 모든 액션 버튼 (수정/확인/삭제) 사라짐
    await expect(page.getByRole('button', { name: L.editAction })).toHaveCount(0);
    await expect(page.getByRole('button', { name: L.confirmAction })).toHaveCount(0);
    await expect(page.getByRole('button', { name: L.deleteAction })).toHaveCount(0);
  });
});
