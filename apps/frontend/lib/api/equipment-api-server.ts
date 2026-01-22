/**
 * ============================================================================
 * Equipment API - Server Component 버전
 * ============================================================================
 *
 * ⚠️ IMPORTANT: Server Component 전용
 *
 * 이 파일은 Next.js Server Components에서만 사용됩니다.
 * - getServerSession()을 통한 인증
 * - async/await 직접 사용 가능
 * - React Query 불필요
 *
 * 사용 예시:
 *   // app/equipment/[id]/page.tsx
 *   import * as equipmentApi from '@/lib/api/equipment-api-server';
 *
 *   export default async function Page(props: PageProps) {
 *     const { id } = await props.params;
 *     const equipment = await equipmentApi.getEquipment(id);
 *     return <EquipmentDetailClient equipment={equipment} />;
 *   }
 *
 * Client Component에서는 기존 equipment-api.ts를 사용하세요.
 * ============================================================================
 */

import { createServerApiClient } from './server-api-client';
import { transformPaginatedResponse, transformSingleResponse } from './utils/response-transformers';
import type { PaginatedResponse } from './types';
import type {
  Equipment,
  EquipmentQuery,
  CreateEquipmentDto,
  UpdateEquipmentDto,
  EquipmentMutationResponse,
  LocationHistoryItem,
  MaintenanceHistoryItem,
  IncidentHistoryItem,
  CreateLocationHistoryInput,
  CreateMaintenanceHistoryInput,
  CreateIncidentHistoryInput,
} from './equipment-api';
import type { EquipmentStatus } from '@equipment-management/schemas';

/**
 * 장비 목록 조회 (Server Component)
 */
export async function getEquipmentList(
  query: EquipmentQuery = {} as EquipmentQuery
): Promise<PaginatedResponse<Equipment>> {
  const apiClient = await createServerApiClient();

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  const url = `/api/equipment${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await apiClient.get(url);
  return transformPaginatedResponse<Equipment>(response);
}

/**
 * 장비 상세 조회 (Server Component)
 *
 * @param id - 장비 ID (string 또는 number)
 * @returns Promise<Equipment>
 *
 * @example
 * ```typescript
 * // Server Component
 * export default async function EquipmentDetailPage(props: PageProps) {
 *   const { id } = await props.params;
 *   const equipment = await getEquipment(id);
 *   return <EquipmentDetail equipment={equipment} />;
 * }
 * ```
 */
export async function getEquipment(id: string | number): Promise<Equipment> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.get(`/api/equipment/${id}`);
  return transformSingleResponse<Equipment>(response);
}

/**
 * 장비 생성 (Server Component)
 *
 * ⚠️ 주의: 파일 업로드는 Server Component에서 직접 처리하기 어려우므로
 * 파일 업로드가 필요한 경우 Server Action을 사용하거나
 * Client Component에서 처리하세요.
 */
export async function createEquipment(data: CreateEquipmentDto): Promise<EquipmentMutationResponse> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.post('/api/equipment', data);
  return transformSingleResponse<EquipmentMutationResponse>(response);
}

/**
 * 장비 수정 (Server Component)
 *
 * ⚠️ 주의: 파일 업로드는 Server Component에서 직접 처리하기 어려우므로
 * 파일 업로드가 필요한 경우 Server Action을 사용하거나
 * Client Component에서 처리하세요.
 */
export async function updateEquipment(
  id: string | number,
  data: UpdateEquipmentDto
): Promise<EquipmentMutationResponse> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.patch(`/api/equipment/${id}`, data);
  return transformSingleResponse<EquipmentMutationResponse>(response);
}

/**
 * 장비 삭제 (Server Component)
 */
export async function deleteEquipment(id: string | number): Promise<void> {
  const apiClient = await createServerApiClient();
  await apiClient.delete(`/api/equipment/${id}`);
}

/**
 * 장비 상태 변경 (Server Component)
 */
export async function updateEquipmentStatus(
  id: string | number,
  status: EquipmentStatus
): Promise<Equipment> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.patch(`/api/equipment/${id}/status`, { status });
  return transformSingleResponse<Equipment>(response);
}

/**
 * 교정 예정 장비 조회 (Server Component)
 */
export async function getCalibrationDueEquipment(days: number = 30): Promise<Equipment[]> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.get(`/api/equipment/calibration/due?days=${days}`);
  return response.data;
}

/**
 * 팀별 장비 조회 (Server Component)
 */
export async function getTeamEquipment(teamId: string): Promise<Equipment[]> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.get(`/api/equipment/team/${teamId}`);
  return response.data;
}

// ========== 승인 프로세스 API ==========

export async function getPendingRequests(): Promise<any[]> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.get('/api/equipment/requests/pending');
  return response.data || [];
}

export async function getRequestByUuid(requestUuid: string): Promise<any> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.get(`/api/equipment/requests/${requestUuid}`);
  return response.data;
}

export async function approveRequest(requestUuid: string): Promise<any> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.post(`/api/equipment/requests/${requestUuid}/approve`);
  return response.data;
}

export async function rejectRequest(requestUuid: string, rejectionReason: string): Promise<any> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.post(`/api/equipment/requests/${requestUuid}/reject`, {
    rejectionReason,
  });
  return response.data;
}

// ========== 이력 관리 API ==========

export async function getLocationHistory(equipmentUuid: string): Promise<LocationHistoryItem[]> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.get(`/api/equipment/${equipmentUuid}/location-history`);
  return response.data || response;
}

export async function createLocationHistory(
  equipmentUuid: string,
  data: CreateLocationHistoryInput
): Promise<LocationHistoryItem> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.post(`/api/equipment/${equipmentUuid}/location-history`, data);
  return response.data || response;
}

export async function deleteLocationHistory(historyId: string): Promise<void> {
  const apiClient = await createServerApiClient();
  await apiClient.delete(`/api/equipment/location-history/${historyId}`);
}

export async function getMaintenanceHistory(equipmentUuid: string): Promise<MaintenanceHistoryItem[]> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.get(`/api/equipment/${equipmentUuid}/maintenance-history`);
  return response.data || response;
}

export async function createMaintenanceHistory(
  equipmentUuid: string,
  data: CreateMaintenanceHistoryInput
): Promise<MaintenanceHistoryItem> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.post(
    `/api/equipment/${equipmentUuid}/maintenance-history`,
    data
  );
  return response.data || response;
}

export async function deleteMaintenanceHistory(historyId: string): Promise<void> {
  const apiClient = await createServerApiClient();
  await apiClient.delete(`/api/equipment/maintenance-history/${historyId}`);
}

export async function getIncidentHistory(equipmentUuid: string): Promise<IncidentHistoryItem[]> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.get(`/api/equipment/${equipmentUuid}/incident-history`);
  return response.data || response;
}

export async function createIncidentHistory(
  equipmentUuid: string,
  data: CreateIncidentHistoryInput
): Promise<IncidentHistoryItem> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.post(`/api/equipment/${equipmentUuid}/incident-history`, data);
  return response.data || response;
}

export async function deleteIncidentHistory(historyId: string): Promise<void> {
  const apiClient = await createServerApiClient();
  await apiClient.delete(`/api/equipment/incident-history/${historyId}`);
}

export async function getCalibrationHistory(equipmentUuid: string): Promise<any[]> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.get(`/api/calibrations?equipmentId=${equipmentUuid}`);
  const responseData = response as any;
  return responseData.data?.items || responseData.items || responseData.data || [];
}
