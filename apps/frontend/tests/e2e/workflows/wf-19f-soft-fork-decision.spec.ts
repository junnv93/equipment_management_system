/**
 * WF-19f: SoftForkDialog — 표 구조 변경 시 명시적 의사결정 (Phase 1B-E + 1B-G)
 *
 * UL-QP-18 §7.5 양식 통제 (LIMS 표준 LabWare/Veeva Vault/Beamex CMX 정합):
 * 사용자가 점검 작성 중 *표 구조*를 변경한 경우 — 제출 직전 SoftForkDialog로 명시적 결정 요구.
 * 자동 적용 금지 — 양식 변경은 *암묵적 적용 금지*가 LIMS 표준이다.
 *
 * 검증 범위 (contract M-7, M-14.3):
 *   1. 변경 *없음* → 직접 제출 (SoftForkDialog 안 뜸) — 회귀 가드
 *   2. 변경 *있음* + 권한 미보유(TE) → SoftForkDialog 노출 + apply_forward radio disabled
 *   3. cancel → SoftForkDialog 닫힘 + 점검 미생성 (DB 검증)
 *   4. apply_forward 실제 제출 → template v+1 + inspection 생성
 *   5. API-level 권한 분기 — POST /api/equipment/:id/inspection-template:
 *      - TE/TM(권한 미보유) → 403
 *      - LM(MANAGE_INSPECTION_TEMPLATE 보유) → 201
 *
 * 더 깊은 diff visualization 디테일은 RTL 단위 test (`SoftForkDialog.test.tsx` 4 tests)가 cover.
 * 본 e2e는 제출 경계와 권한 경계 검증에 집중.
 *
 * @see apps/frontend/components/inspections/SoftForkDialog.tsx
 * @see apps/backend/src/modules/inspection-form-templates/inspection-form-templates.controller.ts
 */

import { test, expect, type Page } from '../shared/fixtures/auth.fixture';
import {
  resetIntermediateInspections,
  clearBackendCache,
  cleanupSharedPool,
  getSharedPool,
} from './helpers/workflow-helpers';
import {
  resetInspectionTemplates,
  upsertInspectionTemplate,
  REFERENCE_TEMPLATE_STRUCTURE,
} from './helpers/inspection-template-helpers';
import { TEST_CALIBRATION_IDS, TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';

// SIGNAL_GEN_SUW_E 격리 — wf-19c/d/g 다른 장비 사용
const WF_CALIBRATION_ID = TEST_CALIBRATION_IDS.CALIB_002;
const WF_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.SIGNAL_GEN_SUW_E;

test.describe.configure({ mode: 'serial' });

async function openInspectionDialog(page: Page): Promise<void> {
  await page.goto(`${FRONTEND_ROUTES.EQUIPMENT.DETAIL(WF_EQUIPMENT_ID)}?tab=inspection`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: /중간점검 기록/ })).toBeVisible();

  await page.getByRole('button', { name: '점검 기록 작성' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

/**
 * Template 선시드 — REFERENCE_TEMPLATE_STRUCTURE를 v1로 등록.
 * SoftForkDialog 트리거에 필요한 *기존 양식*이 있어야 변경 감지 가능.
 */
async function seedReferenceTemplate(page: Page): Promise<void> {
  await resetInspectionTemplates(WF_EQUIPMENT_ID);
  const resp = await upsertInspectionTemplate(
    page,
    WF_EQUIPMENT_ID,
    {
      inspectionType: 'intermediate',
      version: 1,
      structure: REFERENCE_TEMPLATE_STRUCTURE,
    },
    'lab_manager'
  );
  expect(resp.status(), `seed upsert response: ${resp.status()}`).toBe(201);
  await clearBackendCache();
}

/**
 * 종합 판정 Select — Radix Select 컴포넌트 (combobox role).
 */
async function selectOverallResult(page: Page, value: '적합' | '부적합' | '조건부 적합') {
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox').first().click();
  await page.getByRole('option', { name: value }).click();
}

/**
 * 표 구조 변경 — prefill된 첫 item의 checkItem을 *rename*하여 structure diff 트리거.
 *
 * 견고성: value-based selector("WF-19f 외관 검사")로 정확히 1개 input만 매칭.
 * 새 item 추가 방식은 dialog 내 빈 input(inspectionDate 등)과 충돌 가능성 — 회피.
 *
 * structure-diff: 같은 sortOrder의 checkItem 이름이 다르면 itemsAdded + itemsRemoved 발생.
 */
async function modifyStructure(page: Page) {
  const dialog = page.getByRole('dialog');
  await dialog.locator('input[value="WF-19f 외관 검사"]').fill('WF-19f 외관 검사 (변경됨)');
}

// =============================================================================
// 시나리오 1: 변경 없음 → SoftForkDialog 안 뜸 (회귀 가드)
// =============================================================================

test.describe('WF-19f-1: 표 구조 변경 없음 → SoftForkDialog 안 뜸', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await resetIntermediateInspections(WF_CALIBRATION_ID);
      await seedReferenceTemplate(page);
    } finally {
      await ctx.close();
    }
  });

  test.afterAll(async () => {
    await resetIntermediateInspections(WF_CALIBRATION_ID);
    await resetInspectionTemplates(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('S1: prefill된 양식 그대로 저장 → 직접 제출 (SoftForkDialog 미노출)', async ({
    testOperatorPage: page,
  }) => {
    await openInspectionDialog(page);
    const dialog = page.getByRole('dialog');

    // 첫 점검(template) prefill 검증 — 후속 회귀 가드 의미
    await expect(dialog.locator('input[value="WF-19f 외관 검사"]')).toBeVisible();

    // 종합 판정 선택 + 점검일은 master prefill (생략 가능 시 자동)
    await selectOverallResult(page, '적합');

    // 저장 클릭 — 변경 없음이므로 SoftForkDialog 안 뜨고 그대로 제출
    await dialog.getByRole('button', { name: '저장' }).click();

    // SoftForkDialog *제목* (양식 구조가 변경되었습니다)이 절대 노출되면 안 됨
    await expect(page.getByText('양식 구조가 변경되었습니다')).toHaveCount(0);

    // 직접 제출이 *실제로 성공*했는지 DB 검증 — false PASS(SoftFork도 미노출 + 제출도 실패) 차단
    // 다이얼로그가 닫히길 기다린 후 inspection 1건 존재 확인
    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 10000 });
    const pool = getSharedPool();
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM intermediate_inspections
       WHERE calibration_id = $1 AND id::text NOT LIKE 'ffff%'`,
      [WF_CALIBRATION_ID]
    );
    expect(Number(result.rows[0].count)).toBe(1);
  });
});

// =============================================================================
// 시나리오 2: 변경 있음 + TE(권한 미보유) → SoftFork 노출 + apply_forward disabled
// =============================================================================

test.describe('WF-19f-2: 표 구조 변경 있음 → SoftForkDialog 노출 + 권한 분기', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await resetIntermediateInspections(WF_CALIBRATION_ID);
      await seedReferenceTemplate(page);
    } finally {
      await ctx.close();
    }
  });

  test.afterAll(async () => {
    await resetIntermediateInspections(WF_CALIBRATION_ID);
    await resetInspectionTemplates(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('S2: TE(권한 미보유) — SoftForkDialog 노출 + apply_forward radio disabled + cancel 시 점검 미생성', async ({
    testOperatorPage: page,
  }) => {
    await openInspectionDialog(page);
    const dialog = page.getByRole('dialog');

    // 종합 판정 선택 + 표 구조 변경
    await selectOverallResult(page, '적합');
    await modifyStructure(page);

    // 저장 → SoftForkDialog 노출
    await dialog.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText('양식 구조가 변경되었습니다')).toBeVisible();

    // apply_forward radio가 disabled — 권한 미보유 사유 표시
    const applyForwardRadio = page.getByRole('radio', {
      name: /다음 점검부터 변경 적용/,
    });
    await expect(applyForwardRadio).toBeDisabled();
    // 사유 노출 — i18n: descriptionDisabled "양식 통제 권한이 필요합니다 (품질책임자 또는 시험소장)."
    await expect(page.getByText(/양식 통제 권한이 필요/)).toBeVisible();

    // cancel — "편집으로 돌아가기"
    await page.getByRole('button', { name: /편집으로 돌아가기/ }).click();
    await expect(page.getByText('양식 구조가 변경되었습니다')).toHaveCount(0);

    // DB 검증 — 점검이 *생성되지 않아야* 함 (cancel은 제출 차단)
    const pool = getSharedPool();
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM intermediate_inspections
       WHERE calibration_id = $1 AND id::text NOT LIKE 'ffff%'`,
      [WF_CALIBRATION_ID]
    );
    expect(Number(result.rows[0].count)).toBe(0);
  });
});

// =============================================================================
// 시나리오 3: 변경 있음 + 권한 보유 → apply_forward 실제 제출
// =============================================================================

test.describe('WF-19f-3: 표 구조 변경 있음 + 권한 보유 → apply_forward 제출', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await resetIntermediateInspections(WF_CALIBRATION_ID);
      await seedReferenceTemplate(page);
    } finally {
      await ctx.close();
    }
  });

  test.afterAll(async () => {
    await resetIntermediateInspections(WF_CALIBRATION_ID);
    await resetInspectionTemplates(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('S3: system_admin — apply_forward 선택 → template v2 + 점검 생성', async ({
    systemAdminPage: page,
  }) => {
    await openInspectionDialog(page);
    const dialog = page.getByRole('dialog');

    await selectOverallResult(page, '적합');
    await modifyStructure(page);

    await dialog.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText('양식 구조가 변경되었습니다')).toBeVisible();

    const applyForwardRadio = page.getByRole('radio', {
      name: /다음 점검부터 변경 적용/,
    });
    await expect(applyForwardRadio).toBeEnabled();
    await expect(applyForwardRadio).toBeChecked();

    await page.getByRole('button', { name: '선택대로 제출' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 10000 });

    const pool = getSharedPool();
    const inspection = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM intermediate_inspections
       WHERE calibration_id = $1 AND id::text NOT LIKE 'ffff%'`,
      [WF_CALIBRATION_ID]
    );
    expect(Number(inspection.rows[0].count)).toBe(1);

    const template = await pool.query<{ count: string; latest_version: number }>(
      `SELECT COUNT(*)::text AS count, MAX(version)::int AS latest_version
       FROM inspection_form_templates
       WHERE equipment_id = $1 AND inspection_type = 'intermediate' AND deleted_at IS NULL`,
      [WF_EQUIPMENT_ID]
    );
    expect(Number(template.rows[0].count)).toBeGreaterThanOrEqual(2);
    expect(template.rows[0].latest_version).toBe(2);
  });
});

// =============================================================================
// 시나리오 4: API-level 권한 분기 — POST /inspection-template
// =============================================================================

test.describe('WF-19f-4: API 권한 분기 — POST /inspection-template', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await resetIntermediateInspections(WF_CALIBRATION_ID);
    await resetInspectionTemplates(WF_EQUIPMENT_ID);
  });

  test.afterAll(async () => {
    await resetIntermediateInspections(WF_CALIBRATION_ID);
    await resetInspectionTemplates(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('S3a: TE — 403 (Permission.MANAGE_INSPECTION_TEMPLATE 미보유)', async ({
    testOperatorPage: page,
  }) => {
    const resp = await upsertInspectionTemplate(
      page,
      WF_EQUIPMENT_ID,
      {
        inspectionType: 'intermediate',
        version: 1,
        structure: REFERENCE_TEMPLATE_STRUCTURE,
      },
      'test_engineer'
    );
    expect(resp.status()).toBe(403);
  });

  test('S3b: TM — 403 (Permission.MANAGE_INSPECTION_TEMPLATE 미보유)', async ({
    techManagerPage: page,
  }) => {
    const resp = await upsertInspectionTemplate(
      page,
      WF_EQUIPMENT_ID,
      {
        inspectionType: 'intermediate',
        version: 1,
        structure: REFERENCE_TEMPLATE_STRUCTURE,
      },
      'technical_manager'
    );
    expect(resp.status()).toBe(403);
  });

  test('S3c: LM — 201 + audit_logs 기록 (Permission.MANAGE_INSPECTION_TEMPLATE 보유)', async ({
    siteAdminPage: page,
  }) => {
    const resp = await upsertInspectionTemplate(
      page,
      WF_EQUIPMENT_ID,
      {
        inspectionType: 'intermediate',
        version: 1,
        structure: REFERENCE_TEMPLATE_STRUCTURE,
      },
      'lab_manager'
    );
    expect(resp.status()).toBe(201);

    // contract M-8: audit_logs에 entity_type='inspection_form_template' row 기록 검증
    // UL-QP-18 §7.5 양식 통제 — actor 정확히 식별되어야 (이름 + 역할)
    const body = (await resp.json()) as { id: string };
    const pool = getSharedPool();
    const audit = await pool.query<{ count: string; user_role: string }>(
      `SELECT COUNT(*)::text AS count, MIN(user_role) AS user_role FROM audit_logs
       WHERE entity_type = 'inspection_form_template' AND entity_id = $1`,
      [body.id]
    );
    expect(Number(audit.rows[0].count)).toBeGreaterThanOrEqual(1);
    // actor 비정규화 (memory: notifications FK 정책과 동일) — 'system' fallback이 아닌 실제 role
    expect(audit.rows[0].user_role).toBe('lab_manager');
  });

  test('S3d: QM — 201 (Permission.MANAGE_INSPECTION_TEMPLATE 보유 — 품질책임자)', async ({
    qualityManagerPage: page,
  }) => {
    // 직전 test에서 v1 생성됨 — v2로 upsert (CAS 정합성)
    const resp = await upsertInspectionTemplate(
      page,
      WF_EQUIPMENT_ID,
      {
        inspectionType: 'intermediate',
        version: 2,
        structure: REFERENCE_TEMPLATE_STRUCTURE,
      },
      'quality_manager'
    );
    expect(resp.status()).toBe(201);
  });
});
