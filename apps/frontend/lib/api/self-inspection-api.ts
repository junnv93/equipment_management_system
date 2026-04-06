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
  const response = await apiClient.get(API_ENDPOINTS.SELF_INSPECTIONS.BY_EQUIPMENT(equipmentId), {
    params: { page, pageSize },
  });
  const data = response.data?.data ?? response.data;
  return data;
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

// SSOT: 양식 내보내기 함수는 reports-api.ts로 이동됨 — re-export로 기존 소비자 호환 유지
export { exportFormTemplate, downloadHistoryCard } from './reports-api';
