import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { transformSingleResponse } from './utils/response-transformers';
import type {
  SelfInspectionItemJudgment,
  SelfInspectionResult,
  SelfInspectionStatus,
  SpecialNote,
} from '@equipment-management/schemas';

export interface SelfInspectionItem {
  id: string;
  inspectionId: string;
  itemNumber: number;
  checkItem: string;
  checkResult: SelfInspectionItemJudgment;
}

export interface SelfInspection {
  id: string;
  equipmentId: string;
  inspectionDate: string;
  inspectorId: string;
  appearance: SelfInspectionItemJudgment;
  functionality: SelfInspectionItemJudgment;
  safety: SelfInspectionItemJudgment;
  calibrationStatus: SelfInspectionItemJudgment;
  overallResult: SelfInspectionResult;
  remarks: string | null;
  specialNotes: SpecialNote[] | null;
  items: SelfInspectionItem[];
  inspectionCycle: number;
  nextInspectionDate: string | null;
  status: SelfInspectionStatus;
  confirmedBy: string | null;
  confirmedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SelfInspectionItemInput {
  itemNumber: number;
  checkItem: string;
  checkResult: SelfInspectionItemJudgment;
}

export interface CreateSelfInspectionDto {
  inspectionDate: string;
  items: SelfInspectionItemInput[];
  overallResult: SelfInspectionResult;
  remarks?: string;
  specialNotes?: SpecialNote[];
  inspectionCycle?: number;
  // 하위 호환
  appearance?: SelfInspectionItemJudgment;
  functionality?: SelfInspectionItemJudgment;
  safety?: SelfInspectionItemJudgment;
  calibrationStatus?: SelfInspectionItemJudgment;
}

export interface UpdateSelfInspectionDto {
  version: number;
  inspectionDate?: string;
  items?: SelfInspectionItemInput[];
  overallResult?: SelfInspectionResult;
  remarks?: string;
  specialNotes?: SpecialNote[];
  inspectionCycle?: number;
  appearance?: SelfInspectionItemJudgment;
  functionality?: SelfInspectionItemJudgment;
  safety?: SelfInspectionItemJudgment;
  calibrationStatus?: SelfInspectionItemJudgment;
}

export async function getSelfInspections(
  equipmentId: string,
  page = 1,
  pageSize = 20
): Promise<{ data: SelfInspection[]; total: number }> {
  // 백엔드 응답: { data: SelfInspection[], total: number } (envelope 없음)
  // axios interceptor unwrapResponseData는 { success, data } 봉투만 처리하므로
  // 이 엔드포인트는 response.data 자체가 페이지네이션 객체임.
  const response = await apiClient.get<{ data: SelfInspection[]; total: number }>(
    API_ENDPOINTS.SELF_INSPECTIONS.BY_EQUIPMENT(equipmentId),
    { params: { page, pageSize } }
  );
  return response.data;
}

export async function getSelfInspection(id: string): Promise<SelfInspection> {
  const response = await apiClient.get(API_ENDPOINTS.SELF_INSPECTIONS.GET(id));
  return transformSingleResponse(response);
}

export async function createSelfInspection(
  equipmentId: string,
  dto: CreateSelfInspectionDto
): Promise<SelfInspection> {
  const response = await apiClient.post(
    API_ENDPOINTS.SELF_INSPECTIONS.BY_EQUIPMENT(equipmentId),
    dto
  );
  return transformSingleResponse(response);
}

export async function updateSelfInspection(
  id: string,
  dto: UpdateSelfInspectionDto
): Promise<SelfInspection> {
  const response = await apiClient.patch(API_ENDPOINTS.SELF_INSPECTIONS.UPDATE(id), dto);
  return transformSingleResponse(response);
}

export async function confirmSelfInspection(id: string, version: number): Promise<SelfInspection> {
  const response = await apiClient.patch(API_ENDPOINTS.SELF_INSPECTIONS.CONFIRM(id), {
    version,
  });
  return transformSingleResponse(response);
}

export async function deleteSelfInspection(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.SELF_INSPECTIONS.DELETE(id));
}

// ============================================================================
// 결과 섹션 CRUD
// ============================================================================

import type { ResultSection, CreateResultSectionDto } from './calibration-api';
import { transformArrayResponse } from './utils/response-transformers';

export const selfInspectionResultSections = {
  list: async (inspectionId: string): Promise<ResultSection[]> => {
    const response = await apiClient.get(
      API_ENDPOINTS.SELF_INSPECTIONS.RESULT_SECTIONS.LIST(inspectionId)
    );
    return transformArrayResponse<ResultSection>(response);
  },
  create: async (inspectionId: string, dto: CreateResultSectionDto): Promise<ResultSection> => {
    const response = await apiClient.post(
      API_ENDPOINTS.SELF_INSPECTIONS.RESULT_SECTIONS.CREATE(inspectionId),
      dto
    );
    return transformSingleResponse<ResultSection>(response);
  },
  update: async (
    inspectionId: string,
    sectionId: string,
    dto: Partial<CreateResultSectionDto>
  ): Promise<ResultSection> => {
    const response = await apiClient.patch(
      API_ENDPOINTS.SELF_INSPECTIONS.RESULT_SECTIONS.UPDATE(inspectionId, sectionId),
      dto
    );
    return transformSingleResponse<ResultSection>(response);
  },
  delete: async (inspectionId: string, sectionId: string): Promise<void> => {
    await apiClient.delete(
      API_ENDPOINTS.SELF_INSPECTIONS.RESULT_SECTIONS.DELETE(inspectionId, sectionId)
    );
  },
};

// SSOT: 양식 내보내기 함수는 reports-api.ts로 이동됨 — re-export로 기존 소비자 호환 유지
export { exportFormTemplate, downloadHistoryCard } from './reports-api';
