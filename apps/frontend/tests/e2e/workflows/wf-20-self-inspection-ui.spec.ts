/**
 * WF-20 UI: 자체점검 작성/수정/확인/삭제 사용자 동선 (UL-QP-18-05)
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
 * SSOT 준수:
 * - URL: BASE_URLS.BACKEND (constants/shared-test-data.ts)
 * - API 경로: API_ENDPOINTS.SELF_INSPECTIONS.* (@equipment-management/shared-constants)
 * - JWT 토큰: getBackendToken(page, role) (api-helpers.ts) — token cache 공유
 * - 도메인 상수: DEFAULT_SELF_INSPECTION_ITEMS, DEFAULT_SELF_INSPECTION_CYCLE_MONTHS
 *   (@equipment-management/schemas) — magic number 금지
 *
 * @see docs/workflows/critical-workflows.md WF-20
 */

import type { Locator } from '@playwright/test';
import { test, expect, type Page } from '../shared/fixtures/auth.fixture';
// Page type retained for fillSelfInspectionForm helper signature
import {
  resetSelfInspections,
  cleanupSharedPool,
  clearBackendCache,
} from './helpers/workflow-helpers';
import { getBackendToken, clickBelowStickyHeader, expectToastVisible } from '../shared/helpers';
import { BASE_URLS, TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { DEFAULT_SELF_INSPECTION_ITEMS } from '@equipment-management/schemas';

/**
 * 자체점검 카드를 좁히는 narrowing helper.
 *
 * 행 액션 버튼은 컨텍스트 aria-label("{date} 자체점검 기록 수정") 이 부착되어 있어
 * 페이지 전체에서 unique 매칭이 가능하다. 본 helper 는 안전 net + 카드 헤더 검증용.
 */
function selfInspectionCard(page: Page): Locator {
  return page
    .locator('div.rounded-lg.border.bg-card')
    .filter({ has: page.getByRole('heading', { name: /자체점검 이력/ }) })
    .first();
}

/** 행 액션 aria-label 매칭 (i18n: selfInspection.actions.{edit|confirm|delete}AriaLabel) */
const ROW_ACTION_PATTERN = {
  edit: /자체점검 기록 수정$/,
  confirm: /자체점검 기록 확인 처리$/,
  delete: /자체점검 기록 삭제$/,
} as const;

/** 종합결과 + 모든 항목을 "적합"으로 채운다 (Step 1, Step 2 공통) */
async function fillSelfInspectionForm(page: Page, dialog: Locator, isoDate: string) {
  await dialog.locator('input[type="date"]').first().fill(isoDate);

  // 종합결과 — shadcn Select 트리거 클릭 후 옵션 선택
  await dialog.getByText(L.selectResult).click();
  await page.getByRole('option', { name: L.pass, exact: true }).click();

  // DEFAULT_SELF_INSPECTION_ITEMS 자동 시드 — 4 카테고리 강제 검증 후 모두 pass
  const judgmentTriggers = dialog.getByRole('combobox').filter({ hasText: '판정' });
  await expect(
    judgmentTriggers,
    `시드 항목이 ${DEFAULT_SELF_INSPECTION_ITEMS.length}개여야 함`
  ).toHaveCount(DEFAULT_SELF_INSPECTION_ITEMS.length);

  for (let i = 0; i < DEFAULT_SELF_INSPECTION_ITEMS.length; i++) {
    // 트리거 텍스트가 "판정" → "적합" 으로 바뀌면서 필터에서 제외되므로 항상 first()
    await dialog.getByRole('combobox').filter({ hasText: '판정' }).first().click();
    await page.getByRole('option', { name: L.pass, exact: true }).first().click();
  }
}

// FILTER_SUW_E (SUW-E0006, suwon, self_inspection)
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
  confirmDialogTitle: '자체점검 확인',
  confirmDialogAction: '확인 처리',
  statusConfirmed: '확인됨',
  remarksPlaceholder: '비고 사항을 입력하세요',
} as const;

test.describe('WF-20 UI: 자체점검 작성/수정/확인/삭제 동선 (QP-18-05)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await resetSelfInspections(WF_EQUIPMENT_ID);
  });

  test.afterAll(async () => {
    await resetSelfInspections(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('Step 1: TE 작성 → completed → nextInspectionDate 정확히 6개월 후', async ({
    testOperatorPage: page,
  }) => {
    await clearBackendCache();
    await page.goto(`/equipment/${WF_EQUIPMENT_ID}?tab=inspection`);

    const card = selfInspectionCard(page);
    await expect(card.getByRole('button', { name: L.createButton })).toBeVisible({
      timeout: 15000,
    });
    await clickBelowStickyHeader(page, card.getByRole('button', { name: L.createButton }));

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: L.formTitle })).toBeVisible();

    await fillSelfInspectionForm(page, dialog, today);
    await dialog.getByRole('button', { name: L.saveButton }).click();

    await expectToastVisible(page, L.createSuccess);
    await expect(dialog).toBeHidden();

    // 백엔드 영속화 + nextInspectionDate 자동 산출 검증 (SSOT helper 사용)
    // page.request 는 frontend(3000) storageState 만 공유 — backend(3001) 는 cross-origin
    // 이라 JWT 가 자동 전달되지 않으므로 getBackendToken 으로 명시 부착.
    const teToken = await getBackendToken(page, 'test_engineer');
    const verifyResp = await page.request.get(
      `${BASE_URLS.BACKEND}${API_ENDPOINTS.SELF_INSPECTIONS.BY_EQUIPMENT(WF_EQUIPMENT_ID)}?page=1&pageSize=20`,
      { headers: { Authorization: `Bearer ${teToken}` } }
    );
    expect(verifyResp.ok()).toBeTruthy();
    const verifyBody = (await verifyResp.json()) as {
      data: Array<{ inspectionDate: string; nextInspectionDate: string | null; status: string }>;
    };
    const created = verifyBody.data.find((r) => r.inspectionDate.startsWith(today));
    expect(created, `inspectionDate=${today} 레코드가 존재해야 함`).toBeDefined();
    expect(created!.status).toBe('completed');

    // doc: nextInspectionDate = inspectionDate + 6개월 (정확 일치)
    const expected = new Date(`${today}T00:00:00Z`);
    expected.setUTCMonth(expected.getUTCMonth() + 6);
    const expectedIso = expected.toISOString().slice(0, 10);
    expect(created!.nextInspectionDate?.slice(0, 10)).toBe(expectedIso);
  });

  test('Step 2: TE 행 수정 → edit dialog → 비고 추가 → updateSuccess', async ({
    testOperatorPage: page,
  }) => {
    await clearBackendCache();
    await page.goto(`/equipment/${WF_EQUIPMENT_ID}?tab=inspection`);

    const card = selfInspectionCard(page);
    // 행 액션은 컨텍스트 aria-label 로 unique 식별 (i18n editAriaLabel)
    const editBtn = page.getByRole('button', { name: ROW_ACTION_PATTERN.edit }).first();
    await expect(editBtn).toBeVisible({ timeout: 15000 });
    await expect(card.getByRole('button', { name: ROW_ACTION_PATTERN.edit })).toHaveCount(1);
    await clickBelowStickyHeader(page, editBtn);

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: L.editTitle })).toBeVisible();

    // 폼이 기존 값으로 채워져 있는지 — 점검일 비어있지 않음
    await expect(dialog.locator('input[type="date"]').first()).not.toHaveValue('');

    // 비고 추가 후 "수정 저장" 클릭
    await dialog.getByPlaceholder(L.remarksPlaceholder).fill('WF-20 UI: edit dialog 검증');
    await dialog.getByRole('button', { name: L.updateButton }).click();

    await expectToastVisible(page, L.updateSuccess);
    await expect(dialog).toBeHidden();
  });

  test('Step 3: TE 에게 "확인" 버튼은 노출되지 않음 (CONFIRM 권한 없음)', async ({
    testOperatorPage: page,
  }) => {
    await clearBackendCache();
    await page.goto(`/equipment/${WF_EQUIPMENT_ID}?tab=inspection`);

    const card = selfInspectionCard(page);
    await expect(card.getByRole('button', { name: ROW_ACTION_PATTERN.edit }).first()).toBeVisible({
      timeout: 15000,
    });
    await expect(card.getByRole('button', { name: ROW_ACTION_PATTERN.confirm })).toHaveCount(0);
  });

  test('Step 4: TM 확인 → AlertDialog → confirmed', async ({ techManagerPage: page }) => {
    await clearBackendCache();
    await page.goto(`/equipment/${WF_EQUIPMENT_ID}?tab=inspection`);

    const card = selfInspectionCard(page);
    const confirmBtn = page.getByRole('button', { name: ROW_ACTION_PATTERN.confirm }).first();
    await expect(confirmBtn).toBeVisible({ timeout: 15000 });
    await expect(card.getByRole('button', { name: ROW_ACTION_PATTERN.confirm })).toHaveCount(1);
    await clickBelowStickyHeader(page, confirmBtn);

    const alert = page.getByRole('alertdialog');
    await expect(alert.getByRole('heading', { name: L.confirmDialogTitle })).toBeVisible();
    await alert.getByRole('button', { name: L.confirmDialogAction }).click();

    await expectToastVisible(page, L.confirmSuccess);
  });

  test('Step 5: confirmed 상태 → 수정/확인/삭제 버튼 모두 사라짐', async ({
    techManagerPage: page,
  }) => {
    await clearBackendCache();
    await page.goto(`/equipment/${WF_EQUIPMENT_ID}?tab=inspection`);

    const card = selfInspectionCard(page);
    await expect(card.getByText(L.statusConfirmed).first()).toBeVisible({ timeout: 15000 });

    await expect(card.getByRole('button', { name: ROW_ACTION_PATTERN.edit })).toHaveCount(0);
    await expect(card.getByRole('button', { name: ROW_ACTION_PATTERN.confirm })).toHaveCount(0);
    await expect(card.getByRole('button', { name: ROW_ACTION_PATTERN.delete })).toHaveCount(0);
  });
});
