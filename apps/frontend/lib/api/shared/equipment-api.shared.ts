/**
 * ============================================================================
 * Equipment API - Shared Core Logic
 * ============================================================================
 *
 * 이 파일은 Client/Server 양쪽에서 공통으로 사용되는 Equipment API 로직을 포함합니다.
 *
 * 팩토리 패턴을 통해 apiClient를 주입받아 환경에 따라 다른 클라이언트를 사용할 수 있습니다.
 * - Client Component: api-client.ts의 apiClient
 * - Server Component: server-api-client.ts의 createServerApiClient()
 *
 * ⚠️ 주의: 이 파일을 직접 import하지 마세요!
 * - Client: equipment-api.ts 사용
 * - Server: equipment-api-server.ts 사용
 *
 * ============================================================================
 */

import type { AxiosInstance } from 'axios';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import {
  transformPaginatedResponse,
  transformSingleResponse,
  transformArrayResponse,
} from '../utils/response-transformers';
import type { PaginatedResponse } from '../types';
import type { EquipmentStatus } from '@equipment-management/schemas';

// Re-export types from equipment-api.ts
export type {
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
} from '../equipment-api';

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
} from '../equipment-api';

// ============================================================================
// 타입 안전한 응답 처리를 위한 타입 및 헬퍼
// ============================================================================

/**
 * Equipment API 인터페이스
 *
 * Client/Server 양쪽에서 사용할 수 있는 공통 API 인터페이스
 */
export interface EquipmentApiMethods {
  // 기본 CRUD
  getEquipmentList: (query?: EquipmentQuery) => Promise<PaginatedResponse<Equipment>>;
  getEquipment: (id: string | number) => Promise<Equipment>;
  createEquipment: (data: CreateEquipmentDto) => Promise<EquipmentMutationResponse>;
  updateEquipment: (
    id: string | number,
    data: UpdateEquipmentDto
  ) => Promise<EquipmentMutationResponse>;
  deleteEquipment: (id: string | number) => Promise<void>;
  updateEquipmentStatus: (id: string | number, status: EquipmentStatus) => Promise<Equipment>;

  // 특수 조회
  getCalibrationDueEquipment: (days?: number) => Promise<Equipment[]>;
  getTeamEquipment: (teamId: string) => Promise<Equipment[]>;

  // 승인 프로세스
  getPendingRequests: () => Promise<unknown[]>;
  getRequestByUuid: (requestUuid: string) => Promise<unknown>;
  approveRequest: (requestUuid: string, version: number) => Promise<unknown>;
  rejectRequest: (
    requestUuid: string,
    rejectionReason: string,
    version: number
  ) => Promise<unknown>;

  // 이력 관리
  getLocationHistory: (equipmentUuid: string) => Promise<LocationHistoryItem[]>;
  createLocationHistory: (
    equipmentUuid: string,
    data: CreateLocationHistoryInput
  ) => Promise<LocationHistoryItem>;
  deleteLocationHistory: (historyId: string, version?: number) => Promise<void>;
  getMaintenanceHistory: (equipmentUuid: string) => Promise<MaintenanceHistoryItem[]>;
  createMaintenanceHistory: (
    equipmentUuid: string,
    data: CreateMaintenanceHistoryInput
  ) => Promise<MaintenanceHistoryItem>;
  deleteMaintenanceHistory: (historyId: string) => Promise<void>;
  getIncidentHistory: (equipmentUuid: string) => Promise<IncidentHistoryItem[]>;
  createIncidentHistory: (
    equipmentUuid: string,
    data: CreateIncidentHistoryInput
  ) => Promise<IncidentHistoryItem>;
  deleteIncidentHistory: (historyId: string) => Promise<void>;
}

/**
 * Equipment API 팩토리 함수
 *
 * apiClient를 주입받아 Equipment API 메서드들을 생성합니다.
 *
 * @param apiClient - Axios 인스턴스 (Client 또는 Server 버전)
 * @returns Equipment API 메서드 객체
 */
export function createEquipmentApiMethods(apiClient: AxiosInstance): EquipmentApiMethods {
  return {
    // ========== 기본 CRUD ==========

    getEquipmentList: async (
      query: EquipmentQuery = {} as EquipmentQuery
    ): Promise<PaginatedResponse<Equipment>> => {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const url = `${API_ENDPOINTS.EQUIPMENT.LIST}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get(url);
      return transformPaginatedResponse<Equipment>(response);
    },

    getEquipment: async (id: string | number): Promise<Equipment> => {
      const response = await apiClient.get(API_ENDPOINTS.EQUIPMENT.GET(String(id)));
      return transformSingleResponse<Equipment>(response);
    },

    createEquipment: async (data: CreateEquipmentDto): Promise<EquipmentMutationResponse> => {
      const response = await apiClient.post(API_ENDPOINTS.EQUIPMENT.CREATE, data);
      return transformSingleResponse<EquipmentMutationResponse>(response);
    },

    updateEquipment: async (
      id: string | number,
      data: UpdateEquipmentDto
    ): Promise<EquipmentMutationResponse> => {
      const response = await apiClient.patch(API_ENDPOINTS.EQUIPMENT.UPDATE(String(id)), data);
      return transformSingleResponse<EquipmentMutationResponse>(response);
    },

    deleteEquipment: async (id: string | number): Promise<void> => {
      await apiClient.delete(API_ENDPOINTS.EQUIPMENT.DELETE(String(id)));
    },

    updateEquipmentStatus: async (
      id: string | number,
      status: EquipmentStatus
    ): Promise<Equipment> => {
      const response = await apiClient.patch(API_ENDPOINTS.EQUIPMENT.STATUS(String(id)), {
        status,
      });
      return transformSingleResponse<Equipment>(response);
    },

    // ========== 특수 조회 ==========

    getCalibrationDueEquipment: async (days: number = 30): Promise<Equipment[]> => {
      const response = await apiClient.get(
        `${API_ENDPOINTS.EQUIPMENT.CALIBRATION_DUE}?days=${days}`
      );
      return response.data;
    },

    getTeamEquipment: async (teamId: string): Promise<Equipment[]> => {
      const response = await apiClient.get(API_ENDPOINTS.EQUIPMENT.TEAM(teamId));
      return response.data;
    },

    // ========== 승인 프로세스 ==========

    getPendingRequests: async (): Promise<unknown[]> => {
      const response = await apiClient.get(API_ENDPOINTS.EQUIPMENT.REQUESTS.PENDING);
      return response.data || [];
    },

    getRequestByUuid: async (requestUuid: string): Promise<unknown> => {
      const response = await apiClient.get(API_ENDPOINTS.EQUIPMENT.REQUESTS.GET(requestUuid));
      return response.data;
    },

    approveRequest: async (requestUuid: string, version: number): Promise<unknown> => {
      const response = await apiClient.post(API_ENDPOINTS.EQUIPMENT.REQUESTS.APPROVE(requestUuid), {
        version,
      });
      return response.data;
    },

    rejectRequest: async (
      requestUuid: string,
      rejectionReason: string,
      version: number
    ): Promise<unknown> => {
      const response = await apiClient.post(API_ENDPOINTS.EQUIPMENT.REQUESTS.REJECT(requestUuid), {
        rejectionReason,
        version,
      });
      return response.data;
    },

    // ========== 이력 관리 ==========

    getLocationHistory: async (equipmentUuid: string): Promise<LocationHistoryItem[]> => {
      const response = await apiClient.get(
        API_ENDPOINTS.EQUIPMENT.LOCATION_HISTORY.LIST(equipmentUuid)
      );
      return transformArrayResponse<LocationHistoryItem>(response);
    },

    createLocationHistory: async (
      equipmentUuid: string,
      data: CreateLocationHistoryInput
    ): Promise<LocationHistoryItem> => {
      const response = await apiClient.post(
        API_ENDPOINTS.EQUIPMENT.LOCATION_HISTORY.CREATE(equipmentUuid),
        data
      );
      return transformSingleResponse<LocationHistoryItem>(response);
    },

    deleteLocationHistory: async (historyId: string, version?: number): Promise<void> => {
      const url =
        version !== undefined
          ? `${API_ENDPOINTS.EQUIPMENT.LOCATION_HISTORY.DELETE(historyId)}?version=${version}`
          : API_ENDPOINTS.EQUIPMENT.LOCATION_HISTORY.DELETE(historyId);
      await apiClient.delete(url);
    },

    getMaintenanceHistory: async (equipmentUuid: string): Promise<MaintenanceHistoryItem[]> => {
      const response = await apiClient.get(
        API_ENDPOINTS.EQUIPMENT.MAINTENANCE_HISTORY.LIST(equipmentUuid)
      );
      return transformArrayResponse<MaintenanceHistoryItem>(response);
    },

    createMaintenanceHistory: async (
      equipmentUuid: string,
      data: CreateMaintenanceHistoryInput
    ): Promise<MaintenanceHistoryItem> => {
      const response = await apiClient.post(
        API_ENDPOINTS.EQUIPMENT.MAINTENANCE_HISTORY.CREATE(equipmentUuid),
        data
      );
      return transformSingleResponse<MaintenanceHistoryItem>(response);
    },

    deleteMaintenanceHistory: async (historyId: string): Promise<void> => {
      await apiClient.delete(API_ENDPOINTS.EQUIPMENT.MAINTENANCE_HISTORY.DELETE(historyId));
    },

    getIncidentHistory: async (equipmentUuid: string): Promise<IncidentHistoryItem[]> => {
      const response = await apiClient.get(
        API_ENDPOINTS.EQUIPMENT.INCIDENT_HISTORY.LIST(equipmentUuid)
      );
      return transformArrayResponse<IncidentHistoryItem>(response);
    },

    createIncidentHistory: async (
      equipmentUuid: string,
      data: CreateIncidentHistoryInput
    ): Promise<IncidentHistoryItem> => {
      const response = await apiClient.post(
        API_ENDPOINTS.EQUIPMENT.INCIDENT_HISTORY.CREATE(equipmentUuid),
        data
      );
      return transformSingleResponse<IncidentHistoryItem>(response);
    },

    deleteIncidentHistory: async (historyId: string): Promise<void> => {
      await apiClient.delete(API_ENDPOINTS.EQUIPMENT.INCIDENT_HISTORY.DELETE(historyId));
    },
  };
}
