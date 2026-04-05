import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { transformSingleResponse } from './utils/response-transformers';
import type {
  SelfInspectionItemJudgment,
  SelfInspectionResult,
  SelfInspectionStatus,
} from '@equipment-management/schemas';

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
  inspectionCycle: number;
  nextInspectionDate: string | null;
  status: SelfInspectionStatus;
  confirmedBy: string | null;
  confirmedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSelfInspectionDto {
  inspectionDate: string;
  appearance: SelfInspectionItemJudgment;
  functionality: SelfInspectionItemJudgment;
  safety: SelfInspectionItemJudgment;
  calibrationStatus: SelfInspectionItemJudgment;
  overallResult: SelfInspectionResult;
  remarks?: string;
  inspectionCycle?: number;
}

export interface UpdateSelfInspectionDto extends Partial<CreateSelfInspectionDto> {
  version: number;
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

export async function downloadHistoryCard(equipmentId: string): Promise<void> {
  const { downloadFile } = await import('./utils/download-file');
  await downloadFile({
    url: API_ENDPOINTS.EQUIPMENT.HISTORY_CARD(equipmentId),
    filename: `이력카드_${equipmentId.slice(0, 8)}.docx`,
  });
}

export async function exportFormTemplate(
  formNumber: string,
  params?: Record<string, string>
): Promise<void> {
  const { downloadFile } = await import('./utils/download-file');
  await downloadFile({
    url: API_ENDPOINTS.REPORTS.EXPORT.FORM_TEMPLATE(formNumber),
    params,
    filename: `${formNumber}_${new Date().toISOString().split('T')[0]}.xlsx`,
  });
}
