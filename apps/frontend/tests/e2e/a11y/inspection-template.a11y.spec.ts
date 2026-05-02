/**
 * 접근성 게이트 — Inspection Form Build-Once Workflow (WCAG 2.1 AA)
 *
 * Phase 1B-G — contract M-12.5: axe scan 0 violations.
 *
 * 검증 대상 (1B-D/E/F 신규 자산):
 *   1. InspectionFormDialog — DialogHeader missingBadge 노출 상태 (1B-D)
 *   2. InspectionFormDialog — DialogHeader version badge (v1) 노출 상태 (1B-D)
 *   3. SoftForkDialog — 표 구조 변경 시 자동 노출 + RadioGroup + apply_forward disabled (1B-E)
 *
 * Critical + serious violations 0이 게이트 조건 (color-contrast 제외 — CI 헤드리스 정확도 낮음).
 *
 * @see apps/frontend/components/inspections/InspectionFormDialog.tsx
 * @see apps/frontend/components/inspections/SoftForkDialog.tsx
 * @see apps/frontend/components/inspections/TemplateGallery.tsx
 */

import { test, expect, type Page } from '../shared/fixtures/auth.fixture';
import { runAxe, assertNoHighImpact } from '../shared/utils/a11y-helper';
import {
  resetIntermediateInspections,
  clearBackendCache,
  cleanupSharedPool,
  createIntermediateInspection,
  submitIntermediateInspection,
  reviewIntermediateInspection,
  approveIntermediateInspection,
  extractId,
} from '../workflows/helpers/workflow-helpers';
import {
  resetInspectionTemplates,
  upsertInspectionTemplate,
  REFERENCE_TEMPLATE_STRUCTURE,
} from '../workflows/helpers/inspection-template-helpers';
import { TEST_CALIBRATION_IDS, TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';

// 다른 wf spec과 격리 — POWER_SUPPLY_SUW_R + CALIB_004 (WF-19d/f/g와 다른 장비)
const A11Y_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.POWER_SUPPLY_SUW_R;
const A11Y_CALIBRATION_ID = TEST_CALIBRATION_IDS.CALIB_004;

test.describe.configure({ mode: 'serial' });

const today = () => new Date().toISOString().split('T')[0];

async function openInspectionDialog(page: Page): Promise<void> {
  await page.goto(`${FRONTEND_ROUTES.EQUIPMENT.DETAIL(A11Y_EQUIPMENT_ID)}?tab=inspection`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: /중간점검 기록/ })).toBeVisible();
  await page.getByRole('button', { name: '점검 기록 작성' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

// =============================================================================
// 시나리오 1: InspectionFormDialog — missingBadge 상태 (첫 점검, template 부재)
// =============================================================================

test.describe('a11y — InspectionFormDialog (template 부재, missingBadge)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await resetIntermediateInspections(A11Y_CALIBRATION_ID);
    await resetInspectionTemplates(A11Y_EQUIPMENT_ID);
  });

  test.afterAll(async () => {
    await resetIntermediateInspections(A11Y_CALIBRATION_ID);
    await resetInspectionTemplates(A11Y_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('a11y-1: violation 0 — TE 인증 + dialog 열린 상태 + missingBadge 노출', async ({
    testOperatorPage: page,
  }) => {
    await openInspectionDialog(page);
    // missingBadge가 실제 노출됐는지 selector로 확인 (a11y scan 전 상태 보장)
    await expect(page.getByText(/양식 부재.*첫 점검/)).toBeVisible();

    const results = await runAxe(page);
    assertNoHighImpact(results);
  });
});

// =============================================================================
// 시나리오 2: InspectionFormDialog — version badge v1 상태 (template 존재)
// =============================================================================

test.describe('a11y — InspectionFormDialog (template 존재, version badge)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await resetIntermediateInspections(A11Y_CALIBRATION_ID);
      await resetInspectionTemplates(A11Y_EQUIPMENT_ID);
      // 첫 점검 작성 + 승인 → backend가 template auto-create
      const body = await createIntermediateInspection(page, A11Y_CALIBRATION_ID, {
        inspectionDate: today(),
        classification: 'calibrated',
        overallResult: 'pass',
        items: [
          {
            itemNumber: 1,
            checkItem: 'a11y prefill 검사',
            checkCriteria: '정상',
            checkResult: '정상',
            judgment: 'pass' as const,
          },
        ],
      });
      const id = extractId(body);
      await submitIntermediateInspection(page, id, 'test_engineer');
      await reviewIntermediateInspection(page, id, 'technical_manager');
      await approveIntermediateInspection(page, id, 'lab_manager');
      await clearBackendCache();
    } finally {
      await ctx.close();
    }
  });

  test.afterAll(async () => {
    await resetIntermediateInspections(A11Y_CALIBRATION_ID);
    await resetInspectionTemplates(A11Y_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('a11y-2: violation 0 — version badge v1 + 빈 양식 prefill 상태', async ({
    testOperatorPage: page,
  }) => {
    await openInspectionDialog(page);
    // version badge 실제 노출 보장 (auto-create hook이 정상 작동했는지 검증)
    await expect(page.getByText(/v1/)).toBeVisible();

    const results = await runAxe(page);
    assertNoHighImpact(results);
  });
});

// =============================================================================
// 시나리오 3: SoftForkDialog — 표 구조 변경 + 권한 미보유 disabled 사유 노출
// =============================================================================

test.describe('a11y — SoftForkDialog (표 구조 변경 + 권한 분기 disabled)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await resetIntermediateInspections(A11Y_CALIBRATION_ID);
      await resetInspectionTemplates(A11Y_EQUIPMENT_ID);
      // template seed (LM 권한 사용)
      const seed = await upsertInspectionTemplate(
        page,
        A11Y_EQUIPMENT_ID,
        {
          inspectionType: 'intermediate',
          version: 1,
          structure: REFERENCE_TEMPLATE_STRUCTURE,
        },
        'lab_manager'
      );
      expect(seed.status(), `template seed: ${seed.status()}`).toBe(201);
      await clearBackendCache();
    } finally {
      await ctx.close();
    }
  });

  test.afterAll(async () => {
    await resetIntermediateInspections(A11Y_CALIBRATION_ID);
    await resetInspectionTemplates(A11Y_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('a11y-3: violation 0 — SoftForkDialog 노출 + apply_forward disabled', async ({
    testOperatorPage: page,
  }) => {
    await openInspectionDialog(page);
    const dialog = page.getByRole('dialog');

    // 종합 판정 + 표 구조 변경 (prefill된 checkItem 이름 변경 — value-based selector로 견고)
    await dialog.getByRole('combobox').first().click();
    await page.getByRole('option', { name: '적합' }).click();
    await dialog.locator('input[value="WF-19f 외관 검사"]').fill('WF-19f 외관 검사 (a11y 변경)');

    // 저장 → SoftForkDialog 자동 노출
    await dialog.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText('양식 구조가 변경되었습니다')).toBeVisible();
    await expect(page.getByRole('radio', { name: /다음 점검부터 변경 적용/ })).toBeDisabled();

    const results = await runAxe(page);
    assertNoHighImpact(results);
  });
});
