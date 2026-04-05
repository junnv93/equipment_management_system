import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { transformSingleResponse } from './utils/response-transformers';

export interface SelfInspection {
  id: string;
  equipmentId: string;
  inspectionDate: string;
  inspectorId: string;
  appearance: 'pass' | 'fail' | 'na';
  functionality: 'pass' | 'fail' | 'na';
  safety: 'pass' | 'fail' | 'na';
  calibrationStatus: 'pass' | 'fail' | 'na';
  overallResult: 'pass' | 'fail';
  remarks: string | null;
  inspectionCycle: number;
  nextInspectionDate: string | null;
  status: 'draft' | 'completed' | 'confirmed';
  confirmedBy: string | null;
  confirmedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSelfInspectionDto {
  inspectionDate: string;
  appearance: 'pass' | 'fail' | 'na';
  functionality: 'pass' | 'fail' | 'na';
  safety: 'pass' | 'fail' | 'na';
  calibrationStatus: 'pass' | 'fail' | 'na';
  overallResult: 'pass' | 'fail';
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
  const response = await apiClient.get(API_ENDPOINTS.EQUIPMENT.HISTORY_CARD(equipmentId), {
    responseType: 'blob',
  });
  const filename = `이력카드_${equipmentId.slice(0, 8)}.docx`;
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function exportFormTemplate(
  formNumber: string,
  params?: Record<string, string>
): Promise<void> {
  const response = await apiClient.get(API_ENDPOINTS.REPORTS.EXPORT.FORM_TEMPLATE(formNumber), {
    params,
    responseType: 'blob',
  });
  const filename = `${formNumber}_${new Date().toISOString().split('T')[0]}.xlsx`;
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
