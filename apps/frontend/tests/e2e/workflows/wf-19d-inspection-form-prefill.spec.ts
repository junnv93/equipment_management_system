/**
 * WF-19d: 중간점검 등록 폼 — Build-Once Workflow template prefill regression
 *
 * Phase 1B-D (2026-05-02) 에서 prefill 메커니즘 전면 전환:
 * 기존 (deprecated): 직전 *승인* 중간점검의 items/resultSections 복사
 * 신규 (LIMS 표준): 첫 점검 *승인* 시 backend가 template auto-create →
 *                    이후 모든 점검은 *template snapshot*에서 prefill
 *
 * 핵심 회귀 가드 (contract M-14.1, M-14.2):
 *   직전 점검이 *반려* 상태여도 template은 영향받지 않음 — prefill 유지.
 *   "직전 점검 상태"가 prefill을 깨뜨리던 회귀를 영구 차단한다.
 *
 * 검증 시나리오 (LIMS 업계 표준 LabWare/Veeva Vault/Beamex CMX 정합):
 *   1. 첫 점검 — template 부재 → DialogHeader missingBadge + 빈 양식
 *   2. 첫 점검 승인 → template auto-create → 두 번째 점검 dialog →
 *      DialogHeader v1 + items/resultSections prefill
 *   3. 직전 점검을 추가로 *반려* 처리 → template은 v1 유지 → prefill 유지 (M-14.2 핵심)
 *
 * @see apps/frontend/components/inspections/InspectionFormDialog.tsx
 * @see apps/backend/src/modules/intermediate-inspections/intermediate-inspections.service.ts (approve hook)
 * @see docs/procedure/양식/QP-18-03_중간점검표.md
 */

import { test, expect, type Page } from '../shared/fixtures/auth.fixture';
import {
  createIntermediateInspection,
  submitIntermediateInspection,
  reviewIntermediateInspection,
  approveIntermediateInspection,
  rejectIntermediateInspection,
  resetIntermediateInspections,
  clearBackendCache,
  extractId,
  cleanupSharedPool,
} from './helpers/workflow-helpers';
import {
  resetInspectionTemplates,
  findCurrentTemplateId,
} from './helpers/inspection-template-helpers';
import { TEST_CALIBRATION_IDS, TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';

// SPECTRUM_ANALYZER 격리 — wf-19c, wf-19f, wf-19g가 다른 장비를 사용
const WF_CALIBRATION_ID = TEST_CALIBRATION_IDS.CALIB_003;
const WF_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.NETWORK_ANALYZER_SUW_E;

test.describe.configure({ mode: 'serial' });

const today = () => new Date().toISOString().split('T')[0];

const APPROVED_ITEMS = [
  {
    itemNumber: 1,
    checkItem: 'WF-19d 외관 검사',
    checkCriteria: '손상/마모 없음',
    checkResult: '정상',
    judgment: 'pass' as const,
  },
  {
    itemNumber: 2,
    checkItem: 'WF-19d RF 출력 검사',
    checkCriteria: 'CW Level ±1 dB',
    checkResult: '편차 0.2 dB',
    judgment: 'pass' as const,
  },
];

async function openInspectionDialog(page: Page): Promise<void> {
  await page.goto(`${FRONTEND_ROUTES.EQUIPMENT.DETAIL(WF_EQUIPMENT_ID)}?tab=inspection`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: /중간점검 기록/ })).toBeVisible();

  await page.getByRole('button', { name: '점검 기록 작성' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

async function createApprovedInspection(page: Page): Promise<string> {
  const body = await createIntermediateInspection(page, WF_CALIBRATION_ID, {
    inspectionDate: today(),
    classification: 'calibrated',
    inspectionCycle: '6개월',
    calibrationValidityPeriod: '1년',
    overallResult: 'pass',
    remarks: 'WF-19d approved base inspection',
    items: APPROVED_ITEMS,
  });
  const id = extractId(body);
  await submitIntermediateInspection(page, id, 'test_engineer');
  await reviewIntermediateInspection(page, id, 'technical_manager');
  await approveIntermediateInspection(page, id, 'lab_manager');
  await clearBackendCache();
  return id;
}

async function createRejectedInspection(page: Page): Promise<string> {
  const body = await createIntermediateInspection(page, WF_CALIBRATION_ID, {
    inspectionDate: today(),
    classification: 'calibrated',
    overallResult: 'fail',
    remarks: 'WF-19d rejected later inspection',
    items: [
      {
        itemNumber: 1,
        checkItem: 'WF-19d 잘못된 측정',
        checkCriteria: '잘못된 기준',
        checkResult: '편차 5 dB',
        judgment: 'fail' as const,
      },
    ],
  });
  const id = extractId(body);
  await submitIntermediateInspection(page, id, 'test_engineer');
  // submitted → reviewed 단계에서 반려
  await rejectIntermediateInspection(
    page,
    id,
    'WF-19d 의도적 반려: prefill 회귀 가드용',
    'technical_manager'
  );
  await clearBackendCache();
  return id;
}

// =============================================================================
// 시나리오 1: 첫 점검 (template 부재) → missingBadge + 빈 양식
// =============================================================================

test.describe('WF-19d-1: 첫 점검 — template 부재 시 missingBadge + 빈 양식', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    // 깨끗한 시작 — 기존 점검 + template 모두 삭제
    await resetIntermediateInspections(WF_CALIBRATION_ID);
    await resetInspectionTemplates(WF_EQUIPMENT_ID);
  });

  test.afterAll(async () => {
    await resetIntermediateInspections(WF_CALIBRATION_ID);
    await resetInspectionTemplates(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('S1: 첫 점검 dialog → DialogHeader에 missingBadge 노출 + items 빈 채로 시작', async ({
    testOperatorPage: page,
  }) => {
    await openInspectionDialog(page);
    const dialog = page.getByRole('dialog');

    // missingBadge — i18n: intermediateInspection.template.missingBadge "양식 부재 (첫 점검)"
    await expect(dialog.getByText(/양식 부재.*첫 점검/)).toBeVisible();

    // items 빈 채 시작 — APPROVED_ITEMS의 checkItem이 prefill되지 않아야 함
    await expect(dialog.locator('input[value="WF-19d 외관 검사"]')).toHaveCount(0);
    await expect(dialog.locator('input[value="WF-19d RF 출력 검사"]')).toHaveCount(0);
  });
});

// =============================================================================
// 시나리오 2: 첫 점검 승인 → template auto-create → 두 번째 점검 prefill
// =============================================================================

test.describe('WF-19d-2: 첫 점검 승인 → template auto-create → 두 번째 점검 prefill', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await resetIntermediateInspections(WF_CALIBRATION_ID);
      await resetInspectionTemplates(WF_EQUIPMENT_ID);
      // 첫 점검 작성 → 승인 — backend가 approve hook으로 template auto-create
      await createApprovedInspection(page);
    } finally {
      await ctx.close();
    }
  });

  test.afterAll(async () => {
    await resetIntermediateInspections(WF_CALIBRATION_ID);
    await resetInspectionTemplates(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('S2: 두 번째 점검 dialog → DialogHeader v1 + items/resultSections prefill', async ({
    testOperatorPage: page,
  }) => {
    // 직접 DB 검증 — backend approve hook이 fail-soft (silent fail) 하지 않았는지 보장
    // (approve 자체는 성공해도 templateService.autoCreateIfAbsent 실패는 logger만 — UI 회귀 catch 미흡)
    const templateId = await findCurrentTemplateId(WF_EQUIPMENT_ID, 'intermediate');
    expect(
      templateId,
      'backend approve hook 후 template auto-create row 존재해야 함'
    ).not.toBeNull();

    await openInspectionDialog(page);
    const dialog = page.getByRole('dialog');

    // version badge — currentTemplate 존재 → "v1"이 노출되고 missingBadge는 부재
    await expect(dialog.getByText(/v1/)).toBeVisible();
    await expect(dialog.getByText(/양식 부재.*첫 점검/)).toHaveCount(0);

    // items prefill — checkItem/checkCriteria만 (값은 비워짐 — Build-Once value-stripped)
    await expect(dialog.locator('input[value="WF-19d 외관 검사"]')).toBeVisible();
    await expect(dialog.locator('input[value="WF-19d RF 출력 검사"]')).toBeVisible();
    await expect(dialog.locator('input[value="손상/마모 없음"]')).toBeVisible();

    // 값 (checkResult / measurement) 절대 prefill되면 안 됨
    await expect(dialog.locator('input[value="정상"]')).toHaveCount(0);
    await expect(dialog.locator('input[value="편차 0.2 dB"]')).toHaveCount(0);
  });
});

// =============================================================================
// 시나리오 3: 직전 점검 *반려* → template prefill 유지 (M-14.2 핵심 회귀)
// =============================================================================

test.describe('WF-19d-3: 직전 점검 반려 → template prefill 유지 (M-14.2 회귀)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await resetIntermediateInspections(WF_CALIBRATION_ID);
      await resetInspectionTemplates(WF_EQUIPMENT_ID);
      // 1) 첫 점검 승인 → template auto-create (v1)
      await createApprovedInspection(page);
      // 2) 두 번째 점검 작성 → 반려 (템플릿은 영향받지 않아야 함)
      await createRejectedInspection(page);
    } finally {
      await ctx.close();
    }
  });

  test.afterAll(async () => {
    await resetIntermediateInspections(WF_CALIBRATION_ID);
    await resetInspectionTemplates(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('S3: 직전이 *반려*여도 template prefill은 그대로 — Build-Once 보장', async ({
    testOperatorPage: page,
  }) => {
    await openInspectionDialog(page);
    const dialog = page.getByRole('dialog');

    // version badge 여전히 v1 — 반려 점검은 template에 영향 없음
    await expect(dialog.getByText(/v1/)).toBeVisible();

    // 첫 *승인* 점검의 items가 prefill되어야 함 (반려 점검의 잘못된 items 아님)
    await expect(dialog.locator('input[value="WF-19d 외관 검사"]')).toBeVisible();
    await expect(dialog.locator('input[value="WF-19d RF 출력 검사"]')).toBeVisible();

    // 반려 점검의 items는 절대 prefill되면 안 됨 (LIMS 표준)
    await expect(dialog.locator('input[value="WF-19d 잘못된 측정"]')).toHaveCount(0);
    await expect(dialog.locator('input[value="잘못된 기준"]')).toHaveCount(0);
  });
});
