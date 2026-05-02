/**
 * Inspection Form Templates — E2E Helpers (Phase 1B-G)
 *
 * Build-Once Workflow (UL-QP-18 §7.5 양식 통제) backend API 진입점 SSOT.
 *
 * 호출 흐름 (LIMS 표준):
 * - GET latest: useLatestTemplate hook의 backend 정합성 검증용
 * - POST upsert: SoftFork apply_forward 또는 admin 명시 수정 (CAS 409 가능)
 * - GET gallery: 첫 점검 + template 부재 시 매칭 template 조회
 *
 * SSOT: API 경로는 backend controller (inspection-form-templates)와 일관.
 * 이 헬퍼는 *workflow-helpers.ts*의 generic API helper(apiGet/apiPost)를 재사용 — 인증/토큰 흐름 단일화.
 */

import { Page } from '@playwright/test';
import { apiGet, apiPost } from './workflow-helpers';
import { getSharedPool, clearBackendCache } from '../../shared/helpers/api-helpers';
import { getBackendToken } from '../../shared/helpers/api-helpers';
import { BASE_URLS } from '../../shared/constants/shared-test-data';

const BACKEND_URL = BASE_URLS.BACKEND;

export type E2EInspectionType = 'intermediate' | 'self';

export interface UpsertTemplateBody {
  inspectionType: E2EInspectionType;
  version: number;
  structure: {
    items: Array<{ checkItem: string; checkCriteria: string }>;
    resultSections: Array<{
      sectionType: 'table' | 'photo' | 'text';
      sortOrder: number;
      title?: string | null;
      tableColumns?: Array<{ name: string; sortOrder: number }>;
      tableRowCount?: number;
    }>;
  };
  supersededBy?: string;
  sourceInspectionId?: string;
  forkChoice?: 'this_only' | 'apply_forward' | 'cancel';
}

/**
 * 현재 template 조회 (장비 종속 — VIEW_EQUIPMENT 보유자 모두 OK).
 * 부재 시 404 — 호출자가 status 검증.
 */
export async function getInspectionTemplate(
  page: Page,
  equipmentId: string,
  type: E2EInspectionType,
  role = 'test_engineer'
) {
  return apiGet(
    page,
    `/api/equipment/${equipmentId}/inspection-template/latest?type=${type}`,
    role
  );
}

/**
 * Template upsert (POST) — Permission.MANAGE_INSPECTION_TEMPLATE 보유 role만.
 * 동시 수정 시 (equipmentId, inspectionType, version) unique 충돌 → 409.
 *
 * 권한 보유 role: quality_manager, lab_manager, system_admin.
 * 권한 미보유 role(test_engineer / technical_manager) 호출 시 403 — 권한 분기 검증용.
 */
export async function upsertInspectionTemplate(
  page: Page,
  equipmentId: string,
  body: UpsertTemplateBody,
  role = 'lab_manager'
) {
  return apiPost(
    page,
    `/api/equipment/${equipmentId}/inspection-template`,
    body as unknown as Record<string, unknown>,
    role
  );
}

/**
 * Gallery 매칭 조회 — 첫 점검 + template 부재인 장비를 위한 reference 목록.
 * modelName / classificationCode 둘 다 optional이지만 backend는 ≥1 query 필요.
 */
export async function getInspectionTemplateGallery(
  page: Page,
  params: {
    inspectionType: E2EInspectionType;
    modelName?: string;
    classificationCode?: string;
  },
  role = 'test_engineer'
) {
  const search = new URLSearchParams();
  search.set('inspectionType', params.inspectionType);
  if (params.modelName) search.set('modelName', params.modelName);
  if (params.classificationCode) search.set('classificationCode', params.classificationCode);
  const token = await getBackendToken(page, role);
  return page.request.get(`${BACKEND_URL}/api/inspection-templates/gallery?${search.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * 동적 생성된 template 일괄 삭제 + 캐시 클리어.
 * (equipmentId, inspectionType) pair에 대해 *모든* row 삭제 — soft-delete 미구현 가정.
 */
export async function resetInspectionTemplates(equipmentId: string): Promise<void> {
  const pool = getSharedPool();
  await pool.query(`DELETE FROM inspection_form_templates WHERE equipment_id = $1`, [equipmentId]);
  await clearBackendCache();
}

/**
 * Backend가 첫 inspection 승인 시 자동 생성한 template ID 조회 (검증용).
 * id가 *동적 생성*되므로 DB 직접 조회 — supersededBy IS NULL AND deletedAt IS NULL이 current.
 */
export async function findCurrentTemplateId(
  equipmentId: string,
  type: E2EInspectionType
): Promise<string | null> {
  const pool = getSharedPool();
  const res = await pool.query<{ id: string }>(
    `SELECT id FROM inspection_form_templates
     WHERE equipment_id = $1 AND inspection_type = $2
       AND superseded_by IS NULL AND deleted_at IS NULL
     ORDER BY version DESC
     LIMIT 1`,
    [equipmentId, type]
  );
  return res.rows[0]?.id ?? null;
}

/**
 * 표준 reference 양식 — *어떤 장비의* 1B-G test 시드용으로 적정.
 * items 2개 + table 섹션 1개 — 시각적으로 prefill 검증 가능한 최소 단위.
 */
export const REFERENCE_TEMPLATE_STRUCTURE: UpsertTemplateBody['structure'] = {
  items: [
    { checkItem: 'WF-19f 외관 검사', checkCriteria: '손상 없음' },
    { checkItem: 'WF-19f 출력 검사', checkCriteria: '±1 dB 이내' },
  ],
  resultSections: [
    {
      sectionType: 'table',
      sortOrder: 0,
      title: 'WF-19f 측정 결과',
      tableColumns: [
        { name: '주파수', sortOrder: 0 },
        { name: '측정값', sortOrder: 1 },
      ],
      tableRowCount: 3,
    },
  ],
};
