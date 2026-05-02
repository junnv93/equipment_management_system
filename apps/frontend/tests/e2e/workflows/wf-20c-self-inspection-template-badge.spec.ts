/**
 * WF-20c: 자체점검 폼 — Build-Once Workflow template version badge 회귀 가드
 *
 * Backend `self-inspections.service.ts:494`에 동일한 `templateService.autoCreateIfAbsent` hook 작동.
 * Frontend `SelfInspectionFormDialog`도 `useLatestTemplate(equipmentId, 'self')` + version badge UI 사용.
 *
 * 1B-G의 wf-19d/f/g가 *intermediate*만 cover하므로 *self*용 회귀 가드 분리 — 시스템 전반 정합.
 *
 * 검증 시나리오 (1B-G 시니어 자기검토 closure):
 *   1. 첫 자체점검 (template 부재) → DialogHeader missingBadge ("양식 부재 (첫 점검)")
 *   2. 첫 점검 승인 → backend hook이 template auto-create → 두 번째 dialog → version badge v1
 *
 * NOTE: self-inspection은 현재 SoftForkDialog/TemplateGallery를 *사용하지 않음* — version badge만 적용.
 *       향후 self에도 fork/gallery 확장 시 별도 spec 추가.
 *
 * @see apps/backend/src/modules/self-inspections/self-inspections.service.ts (autoCreateIfAbsent)
 * @see apps/frontend/components/inspections/SelfInspectionFormDialog.tsx (lines 393, 421)
 */

import { test, expect, type Page } from '../shared/fixtures/auth.fixture';
import {
  createSelfInspection,
  submitSelfInspection,
  approveSelfInspection,
  resetSelfInspections,
  clearBackendCache,
  cleanupSharedPool,
  extractId,
} from './helpers/workflow-helpers';
import {
  resetInspectionTemplates,
  findCurrentTemplateId,
} from './helpers/inspection-template-helpers';
import { TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';

// 다른 wf-20 spec과 격리 — wf-20-self-inspection-confirmation은 TRANSMITTER_UIW_W 사용
// FILTER_SUW_E (spare 상태) 사용
const WF_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.FILTER_SUW_E;

test.describe.configure({ mode: 'serial' });

const today = () => new Date().toISOString().split('T')[0];

// SelfInspectionItemJudgmentEnum: pass | fail | na (packages/schemas/enums/self-inspection.ts SSOT)
const SELF_ITEMS = [
  { itemNumber: 1, checkItem: 'WF-20c 외관 점검', checkResult: 'pass' as const },
  { itemNumber: 2, checkItem: 'WF-20c 기능 점검', checkResult: 'pass' as const },
];

/**
 * 자체점검은 통합 inspection 탭 안에 표시 (EquipmentTabs 라인 118 — `?tab=self-inspection` →
 * `?tab=inspection` 리다이렉트). InspectionTab 컴포넌트가 management_method에 따라 자체점검 카드 노출.
 */
async function openSelfInspectionDialog(page: Page): Promise<void> {
  await page.goto(`${FRONTEND_ROUTES.EQUIPMENT.DETAIL(WF_EQUIPMENT_ID)}?tab=inspection`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: /자체점검 기록/ })).toBeVisible();

  await page.getByRole('button', { name: '자체점검 기록 작성' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

// =============================================================================
// 시나리오 1: 첫 자체점검 (template 부재) → missingBadge
// =============================================================================

test.describe('WF-20c-1: 첫 자체점검 — template 부재 시 missingBadge', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await resetSelfInspections(WF_EQUIPMENT_ID);
    await resetInspectionTemplates(WF_EQUIPMENT_ID);
  });

  test.afterAll(async () => {
    await resetSelfInspections(WF_EQUIPMENT_ID);
    await resetInspectionTemplates(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('S1: 첫 자체점검 dialog → DialogHeader에 missingBadge 노출', async ({
    testOperatorPage: page,
  }) => {
    await openSelfInspectionDialog(page);

    // missingBadge — i18n: selfInspection.template.missingBadge "양식 부재 (첫 점검)"
    await expect(page.getByText(/양식 부재.*첫 점검/)).toBeVisible();
  });
});

// =============================================================================
// 시나리오 2: 첫 점검 승인 → template auto-create → 두 번째 dialog version badge
// =============================================================================

test.describe('WF-20c-2: 첫 자체점검 승인 → template auto-create → 두 번째 dialog version badge v1', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await resetSelfInspections(WF_EQUIPMENT_ID);
      await resetInspectionTemplates(WF_EQUIPMENT_ID);
      // 첫 자체점검 작성 → 제출 → 승인 (2-step approval: TE submit → TM approve)
      // DTO SSOT: createSelfInspectionSchema (apps/backend/src/modules/self-inspections/dto/)
      const body = await createSelfInspection(page, WF_EQUIPMENT_ID, {
        inspectionDate: today(),
        items: SELF_ITEMS,
        overallResult: 'pass',
      });
      const id = extractId(body);
      await submitSelfInspection(page, id, 'test_engineer');
      await approveSelfInspection(page, id, 'technical_manager');
      await clearBackendCache();
    } finally {
      await ctx.close();
    }
  });

  test.afterAll(async () => {
    await resetSelfInspections(WF_EQUIPMENT_ID);
    await resetInspectionTemplates(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('S2: 두 번째 dialog → version badge v1 + missingBadge 부재 (template auto-create 회귀)', async ({
    testOperatorPage: page,
  }) => {
    // backend approve hook이 fail-soft (silent fail) 하지 않았는지 직접 검증
    const templateId = await findCurrentTemplateId(WF_EQUIPMENT_ID, 'self');
    expect(templateId, 'self approve hook 후 template auto-create row 존재해야 함').not.toBeNull();

    await openSelfInspectionDialog(page);

    // version badge — currentTemplate 존재 → "v1" 노출 + missingBadge 부재
    await expect(page.getByText(/v1/).first()).toBeVisible();
    await expect(page.getByText(/양식 부재.*첫 점검/)).toHaveCount(0);
  });
});
