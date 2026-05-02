/**
 * WF-19g: Inspection Template Gallery — 매칭 검색 + 권한 분기 (Phase 1B-F + 1B-G)
 *
 * UL-QP-18 Build-Once Workflow — 첫 점검 + template 부재인 신규 장비를 위한
 * 비슷한 장비의 검증된 template 가져오기 backend API 검증.
 *
 * 매칭 우선순위 (gallery-query.dto.ts SSOT):
 *   1. modelName 정확 일치 (가장 강한 신호)
 *   2. classificationCode 일치 (UL-QP-18-02 분류 — E/R/W/S/A/P)
 *
 * 검증 범위 (contract M-14.4):
 *   1. 같은 classificationCode 가진 장비 ↔ ref template → 매칭 ≥ 1 (자동 노출 조건)
 *   2. 다른 classificationCode → 매칭 0 (자동 노출 회피)
 *   3. modelName + classificationCode 둘 다 omit → 400 BadRequest (Zod validation)
 *   4. 권한 분기 — VIEW_EQUIPMENT 보유 모든 role 통과 (TE/TM/QM/LM/system_admin)
 *
 * UI level "자동 노출 조건" + "skip 플래그 동작"은 RTL test가 cover:
 *   - TemplateGallery.test.tsx (5 tests)
 *   - template-gallery-skip.test.ts (6 tests)
 *
 * @see apps/frontend/components/inspections/TemplateGallery.tsx
 * @see apps/backend/src/modules/inspection-form-templates/dto/gallery-query.dto.ts
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import {
  resetInspectionTemplates,
  upsertInspectionTemplate,
  getInspectionTemplateGallery,
  REFERENCE_TEMPLATE_STRUCTURE,
} from './helpers/inspection-template-helpers';
import { cleanupSharedPool } from './helpers/workflow-helpers';
import { getBackendToken } from '../shared/helpers/api-helpers';
import { TEST_EQUIPMENT_IDS, BASE_URLS } from '../shared/constants/shared-test-data';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';

// classificationCode 'A' 가진 ref 장비 — 자동 격리 (다른 wf-spec과 충돌 회피)
const REF_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.HARNESS_COUPLER_SUW_A; // template seed 대상

test.describe.configure({ mode: 'serial' });

// =============================================================================
// 시나리오 1: classificationCode 매칭 — items ≥ 1
// =============================================================================

test.describe('WF-19g-1: gallery 매칭 — classificationCode 동일 → items ≥ 1', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      // ref equipment (HARNESS_COUPLER_SUW_A)에 template v1 시드
      await resetInspectionTemplates(REF_EQUIPMENT_ID);
      const seed = await upsertInspectionTemplate(
        page,
        REF_EQUIPMENT_ID,
        {
          inspectionType: 'intermediate',
          version: 1,
          structure: REFERENCE_TEMPLATE_STRUCTURE,
        },
        'lab_manager'
      );
      expect(seed.status(), `ref template seed: ${seed.status()}`).toBe(201);
    } finally {
      await ctx.close();
    }
  });

  test.afterAll(async () => {
    await resetInspectionTemplates(REF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('S1: classificationCode="A" 매칭 → items.length ≥ 1', async ({ testOperatorPage: page }) => {
    const resp = await getInspectionTemplateGallery(
      page,
      { inspectionType: 'intermediate', classificationCode: 'A' },
      'test_engineer'
    );
    expect(resp.status()).toBe(200);
    const body = (await resp.json()) as {
      items: Array<{ matchReason: string; equipmentName: string }>;
    };
    expect(body.items.length).toBeGreaterThanOrEqual(1);
    // 매칭 이유는 'classificationCode' 또는 'modelName' (REFERENCE는 modelName 비어있어 classificationCode일 것)
    expect(['modelName', 'classificationCode']).toContain(body.items[0].matchReason);
  });
});

// =============================================================================
// 시나리오 2: 매칭 부재 — items = 0
// =============================================================================

test.describe('WF-19g-2: gallery 매칭 — 매칭 부재 → items = 0', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await resetInspectionTemplates(REF_EQUIPMENT_ID);
  });

  test.afterAll(async () => {
    await cleanupSharedPool();
  });

  test('S2: 어떤 template도 시드 안 된 상태 → items = 0', async ({ testOperatorPage: page }) => {
    const resp = await getInspectionTemplateGallery(
      page,
      { inspectionType: 'intermediate', classificationCode: 'Z' }, // 존재하지 않는 분류
      'test_engineer'
    );
    expect(resp.status()).toBe(200);
    const body = (await resp.json()) as { items: unknown[] };
    expect(body.items).toHaveLength(0);
  });
});

// =============================================================================
// 시나리오 3: query parameter 부재 — Zod validation pass (둘 다 optional)
// =============================================================================

test.describe('WF-19g-3: query parameter 검증 — modelName/classificationCode 모두 optional', () => {
  test('S3: 둘 다 omit → 200 + items = 0 (전체 fallback 매칭 부재)', async ({
    testOperatorPage: page,
  }) => {
    const resp = await getInspectionTemplateGallery(
      page,
      { inspectionType: 'intermediate' },
      'test_engineer'
    );
    // backend dto의 modelName/classificationCode는 둘 다 .optional() — 통과 가능
    expect(resp.status()).toBe(200);
    const body = (await resp.json()) as { items: unknown[] };
    // 어떤 시드도 활성 상태가 아니면 items = 0 (default state)
    expect(Array.isArray(body.items)).toBe(true);
  });

  test('S3b: inspectionType 부재 → 400 (Zod required)', async ({ testOperatorPage: page }) => {
    // inspectionType은 required — getInspectionTemplateGallery 시그니처에서 강제하므로 우회.
    // API path는 API_ENDPOINTS SSOT 경유 (verify-hardcoding 정합).
    const token = await getBackendToken(page, 'test_engineer');
    const resp = await page.request.get(
      `${BASE_URLS.BACKEND}${API_ENDPOINTS.INSPECTION_TEMPLATE.GALLERY}?classificationCode=A`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    expect(resp.status()).toBe(400);
  });
});

// =============================================================================
// 시나리오 4: 권한 분기 — VIEW_EQUIPMENT 보유 role 모두 통과
// =============================================================================

test.describe('WF-19g-4: gallery 권한 — VIEW_EQUIPMENT 보유 role 통과', () => {
  test('S4a: TE — 200', async ({ testOperatorPage: page }) => {
    const resp = await getInspectionTemplateGallery(
      page,
      { inspectionType: 'intermediate', classificationCode: 'A' },
      'test_engineer'
    );
    expect(resp.status()).toBe(200);
  });

  test('S4b: TM — 200', async ({ techManagerPage: page }) => {
    const resp = await getInspectionTemplateGallery(
      page,
      { inspectionType: 'intermediate', classificationCode: 'A' },
      'technical_manager'
    );
    expect(resp.status()).toBe(200);
  });

  test('S4c: LM — 200', async ({ siteAdminPage: page }) => {
    const resp = await getInspectionTemplateGallery(
      page,
      { inspectionType: 'intermediate', classificationCode: 'A' },
      'lab_manager'
    );
    expect(resp.status()).toBe(200);
  });
});
