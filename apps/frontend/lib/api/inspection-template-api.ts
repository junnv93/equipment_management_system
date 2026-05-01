/**
 * Inspection Form Template API client (Phase 1B-D/E/F)
 *
 * UL-QP-18-03 (중간점검) / UL-QP-18-05 (자체점검) Build-Once Workflow.
 *
 * Endpoints (SSOT: API_ENDPOINTS.INSPECTION_TEMPLATE):
 * - GET    /api/equipment/:id/inspection-template/latest?type=intermediate|self
 * - POST   /api/equipment/:id/inspection-template (admin only — SoftFork apply_forward)
 * - GET    /api/inspection-templates/gallery (Phase 1B-F)
 *
 * 응답 검증:
 * - structure 필드는 backend가 jsonb로 저장 — frontend도 ExtractedInspectionStructureSchema로 재검증
 *   (defense-in-depth — backend zod 외 추가 검증으로 stale snapshot 방어)
 */

import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import {
  ExtractedInspectionStructureSchema,
  InspectionTemplateLatestResponseSchema,
  UpsertInspectionTemplateResponseSchema,
  type ExtractedInspectionStructure,
  type InspectionTemplateLatestResponse,
  type UpsertInspectionTemplateBody,
  type UpsertInspectionTemplateResponse,
} from '@equipment-management/schemas';

// ============================================================================
// Response/Body types — packages/schemas SSOT (Backend ↔ Frontend 단일 정의)
// ============================================================================

// Re-export for callers — `import { ... } from '@/lib/api/inspection-template-api'` 호환
export type {
  InspectionTemplateLatestResponse,
  UpsertInspectionTemplateBody,
  UpsertInspectionTemplateResponse,
};

/** Gallery 응답 entry (Phase 1B-F). */
export interface InspectionTemplateGalleryEntry {
  template: {
    id: string;
    equipmentId: string;
    inspectionType: 'intermediate' | 'self';
    version: number;
    structure: ExtractedInspectionStructure;
    createdAt: string;
  };
  matchReason: 'modelName' | 'classificationCode';
  modelName: string | null;
  equipmentName: string;
}

// ============================================================================
// API functions
// ============================================================================

/**
 * 현재 template 조회 — 부재 시 backend 404 → axios reject (catch에서 처리).
 *
 * 호출자(useLatestTemplate hook)는 axios error의 response.status === 404를
 * "template 부재 = first inspection"으로 해석.
 */
export async function getLatestTemplate(
  equipmentId: string,
  type: 'intermediate' | 'self'
): Promise<InspectionTemplateLatestResponse> {
  const response = await apiClient.get(API_ENDPOINTS.INSPECTION_TEMPLATE.LATEST(equipmentId, type));
  // Defense-in-depth: SSOT schema로 *전체 response* 검증 (createdByName 등 모든 필드 보장).
  // 검증 실패 시 ZodError throw — backend response shape drift를 즉시 감지.
  return InspectionTemplateLatestResponseSchema.parse(response.data);
}

/**
 * Template version+1 (SoftFork apply_forward 또는 admin 명시 수정).
 *
 * Backend CAS:
 * - body.version은 현재 latest + 1이어야 함 (불일치 시 400 INSPECTION_TEMPLATE_INVALID_VERSION)
 * - body.supersededBy는 현재 latest.id이어야 함 (불일치 시 400 INSPECTION_TEMPLATE_STALE_BASE)
 * - 동시 호출로 unique constraint 충돌 시 409 INSPECTION_TEMPLATE_VERSION_CONFLICT
 *
 * 호출자(useUpsertTemplate)는 useCasGuardedMutation 패턴 적용.
 */
export async function upsertTemplate(
  equipmentId: string,
  body: UpsertInspectionTemplateBody
): Promise<UpsertInspectionTemplateResponse> {
  const response = await apiClient.post(
    API_ENDPOINTS.INSPECTION_TEMPLATE.UPSERT(equipmentId),
    body
  );
  return UpsertInspectionTemplateResponseSchema.parse(response.data);
}

/**
 * Gallery 조회 (Phase 1B-F).
 *
 * 매칭 우선순위 (backend service.findGallery):
 * 1. modelName 정확 일치
 * 2. classificationCode 일치
 *
 * 빈 배열 반환 시 호출자(TemplateGallery)는 자동 노출 안 함.
 */
export async function getTemplateGallery(params: {
  inspectionType: 'intermediate' | 'self';
  modelName?: string;
  classificationCode?: string;
  limit?: number;
}): Promise<{ items: InspectionTemplateGalleryEntry[] }> {
  const search = new URLSearchParams();
  search.set('inspectionType', params.inspectionType);
  if (params.modelName) search.set('modelName', params.modelName);
  if (params.classificationCode) search.set('classificationCode', params.classificationCode);
  if (params.limit) search.set('limit', String(params.limit));

  const url = `${API_ENDPOINTS.INSPECTION_TEMPLATE.GALLERY}?${search.toString()}`;
  const response = await apiClient.get(url);
  const raw = response.data as { items: InspectionTemplateGalleryEntry[] };

  // 각 entry의 structure jsonb 무결성 검증
  raw.items = raw.items.map((entry) => ({
    ...entry,
    template: {
      ...entry.template,
      structure: ExtractedInspectionStructureSchema.parse(entry.template.structure),
    },
  }));

  return raw;
}
