/**
 * 접근성 게이트 — Self Inspection Form (WCAG 2.1 AA)
 *
 * Phase PR-3 (2026-05-02) — 자체점검 SelfInspectionFormDialog axe scan 0 violations:
 *   1. 종합결과 ToggleGroup primitive (size lg, pass/fail 2-options)
 *   2. items 6-cell grid row (#/항목/측정값/기준/판정/삭제)
 *   3. 항목 판정 ToggleGroup (pass/fail/na, size sm)
 *   4. DialogHeader status badge — edit 모드에서 INSPECTION_STATUS_BADGE token 적용 상태
 *
 * Critical + serious violations 0이 게이트 조건 (color-contrast 제외 — CI 헤드리스 정확도 낮음).
 *
 * @see apps/frontend/components/inspections/SelfInspectionFormDialog.tsx
 * @see apps/frontend/lib/design-tokens/components/inspection.ts (INSPECTION_CHECKITEM_ROW_GRID, INSPECTION_OVERALL_RESULT_TOGGLE)
 */

import { test, expect, type Page } from '../shared/fixtures/auth.fixture';
import { runAxe, assertNoHighImpact } from '../shared/utils/a11y-helper';
import {
  resetSelfInspections,
  cleanupSharedPool,
  clearBackendCache,
} from '../workflows/helpers/workflow-helpers';
import { TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';

// FILTER_SUW_E (eeee1006-...) — management_method=self_inspection 장비
const A11Y_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.FILTER_SUW_E;

test.describe.configure({ mode: 'serial' });

async function openSelfInspectionDialog(page: Page): Promise<void> {
  await page.goto(`${FRONTEND_ROUTES.EQUIPMENT.DETAIL(A11Y_EQUIPMENT_ID)}?tab=inspection`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: /자체점검 이력/ })).toBeVisible();
  await page.getByRole('button', { name: '점검 기록 작성' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

test.describe('a11y — SelfInspectionFormDialog (ToggleGroup primitive + 6-cell grid)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await resetSelfInspections(A11Y_EQUIPMENT_ID);
    await clearBackendCache();
  });

  test.afterAll(async () => {
    await resetSelfInspections(A11Y_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('a11y: violation 0 — TE 인증 + 자체점검 dialog 열린 상태 + ToggleGroup 노출', async ({
    testOperatorPage: page,
  }) => {
    await openSelfInspectionDialog(page);

    // ToggleGroup 종합결과 노출 보장 (axe scan 전 상태)
    await expect(
      page.getByRole('group', { name: '종합결과 선택 (적합 또는 부적합)' })
    ).toBeVisible();
    // 항목 판정 ToggleGroup 1+ (DEFAULT_SELF_INSPECTION_ITEMS 시드)
    await expect(page.getByRole('group', { name: '점검 결과' }).first()).toBeVisible();

    const results = await runAxe(page);
    assertNoHighImpact(results);
  });
});
