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
 * 교정 이력 API 응답 타입
 * 백엔드 응답 구조에 따라 다양한 형태를 지원
 */
type CalibrationHistoryResponse =
  | { data: { items: unknown[] } }  // 페이지네이션 응답
  | { items: unknown[] }            // 직접 아이템 배열
  | { data: unknown[] }             // 래핑된 배열
  | unknown[];                      // 직접 배열

/**
 * 교정 이력 응답에서 아이템 배열을 안전하게 추출
 */
function extractCalibrationItems(response: CalibrationHistoryResponse): unknown[] {
  // 배열인 경우 직접 반환
  if (Array.isArray(response)) {
    return response;
  }

  // 객체인 경우 다양한 구조 처리
  if (response && typeof response === 'object') {
    // { data: { items: [...] } }
    if ('data' in response && response.data && typeof response.data === 'object' && 'items' in response.data) {
      return Array.isArray(response.data.items) ? response.data.items : [];
    }
    // { items: [...] }
    if ('items' in response) {
      return Array.isArray(response.items) ? response.items : [];
    }
    // { data: [...] }
    if ('data' in response && Array.isArray(response.data)) {
      return response.data;
    }
  }

  return [];
}

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
  updateEquipment: (id: string | number, data: UpdateEquipmentDto) => Promise<EquipmentMutationResponse>;
  deleteEquipment: (id: string | number) => Promise<void>;
  updateEquipmentStatus: (id: string | number, status: EquipmentStatus) => Promise<Equipment>;

  // 특수 조회
  getCalibrationDueEquipment: (days?: number) => Promise<Equipment[]>;
  getTeamEquipment: (teamId: string) => Promise<Equipment[]>;

  // 승인 프로세스
  getPendingRequests: () => Promise<unknown[]>;
  getRequestByUuid: (requestUuid: string) => Promise<unknown>;
  approveRequest: (requestUuid: string) => Promise<unknown>;
  rejectRequest: (requestUuid: string, rejectionReason: string) => Promise<unknown>;

  // 이력 관리
  getLocationHistory: (equipmentUuid: string) => Promise<LocationHistoryItem[]>;
  createLocationHistory: (equipmentUuid: string, data: CreateLocationHistoryInput) => Promise<LocationHistoryItem>;
  deleteLocationHistory: (historyId: string) => Promise<void>;
  getMaintenanceHistory: (equipmentUuid: string) => Promise<MaintenanceHistoryItem[]>;
  createMaintenanceHistory: (equipmentUuid: string, data: CreateMaintenanceHistoryInput) => Promise<MaintenanceHistoryItem>;
  deleteMaintenanceHistory: (historyId: string) => Promise<void>;
  getIncidentHistory: (equipmentUuid: string) => Promise<IncidentHistoryItem[]>;
  createIncidentHistory: (equipmentUuid: string, data: CreateIncidentHistoryInput) => Promise<IncidentHistoryItem>;
  deleteIncidentHistory: (historyId: string) => Promise<void>;
  getCalibrationHistory: (equipmentUuid: string) => Promise<unknown[]>;
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

    getEquipmentList: async (query: EquipmentQuery = {} as EquipmentQuery): Promise<PaginatedResponse<Equipment>> => {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const url = `/api/equipment${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get(url);
      return transformPaginatedResponse<Equipment>(response);
    },

    getEquipment: async (id: string | number): Promise<Equipment> => {
      const response = await apiClient.get(`/api/equipment/${id}`);
      return transformSingleResponse<Equipment>(response);
    },

    createEquipment: async (data: CreateEquipmentDto): Promise<EquipmentMutationResponse> => {
      const response = await apiClient.post('/api/equipment', data);
      return transformSingleResponse<EquipmentMutationResponse>(response);
    },

    updateEquipment: async (id: string | number, data: UpdateEquipmentDto): Promise<EquipmentMutationResponse> => {
      const response = await apiClient.patch(`/api/equipment/${id}`, data);
      return transformSingleResponse<EquipmentMutationResponse>(response);
    },

    deleteEquipment: async (id: string | number): Promise<void> => {
      await apiClient.delete(`/api/equipment/${id}`);
    },

    updateEquipmentStatus: async (id: string | number, status: EquipmentStatus): Promise<Equipment> => {
      const response = await apiClient.patch(`/api/equipment/${id}/status`, { status });
      return transformSingleResponse<Equipment>(response);
    },

    // ========== 특수 조회 ==========

    getCalibrationDueEquipment: async (days: number = 30): Promise<Equipment[]> => {
      const response = await apiClient.get(`/api/equipment/calibration/due?days=${days}`);
      return response.data;
    },

    getTeamEquipment: async (teamId: string): Promise<Equipment[]> => {
      const response = await apiClient.get(`/api/equipment/team/${teamId}`);
      return response.data;
    },

    // ========== 승인 프로세스 ==========

    getPendingRequests: async (): Promise<unknown[]> => {
      const response = await apiClient.get('/api/equipment/requests/pending');
      return response.data || [];
    },

    getRequestByUuid: async (requestUuid: string): Promise<unknown> => {
      const response = await apiClient.get(`/api/equipment/requests/${requestUuid}`);
      return response.data;
    },

    approveRequest: async (requestUuid: string): Promise<unknown> => {
      const response = await apiClient.post(`/api/equipment/requests/${requestUuid}/approve`);
      return response.data;
    },

    rejectRequest: async (requestUuid: string, rejectionReason: string): Promise<unknown> => {
      const response = await apiClient.post(`/api/equipment/requests/${requestUuid}/reject`, {
        rejectionReason,
      });
      return response.data;
    },

    // ========== 이력 관리 ==========

    getLocationHistory: async (equipmentUuid: string): Promise<LocationHistoryItem[]> => {
      const response = await apiClient.get(`/api/equipment/${equipmentUuid}/location-history`);
      return transformArrayResponse<LocationHistoryItem>(response);
    },

    createLocationHistory: async (
      equipmentUuid: string,
      data: CreateLocationHistoryInput
    ): Promise<LocationHistoryItem> => {
      const response = await apiClient.post(`/api/equipment/${equipmentUuid}/location-history`, data);
      return transformSingleResponse<LocationHistoryItem>(response);
    },

    deleteLocationHistory: async (historyId: string): Promise<void> => {
      await apiClient.delete(`/api/equipment/location-history/${historyId}`);
    },

    getMaintenanceHistory: async (equipmentUuid: string): Promise<MaintenanceHistoryItem[]> => {
      const response = await apiClient.get(`/api/equipment/${equipmentUuid}/maintenance-history`);
      return transformArrayResponse<MaintenanceHistoryItem>(response);
    },

    createMaintenanceHistory: async (
      equipmentUuid: string,
      data: CreateMaintenanceHistoryInput
    ): Promise<MaintenanceHistoryItem> => {
      const response = await apiClient.post(
        `/api/equipment/${equipmentUuid}/maintenance-history`,
        data
      );
      return transformSingleResponse<MaintenanceHistoryItem>(response);
    },

    deleteMaintenanceHistory: async (historyId: string): Promise<void> => {
      await apiClient.delete(`/api/equipment/maintenance-history/${historyId}`);
    },

    getIncidentHistory: async (equipmentUuid: string): Promise<IncidentHistoryItem[]> => {
      const response = await apiClient.get(`/api/equipment/${equipmentUuid}/incident-history`);
      return transformArrayResponse<IncidentHistoryItem>(response);
    },

    createIncidentHistory: async (
      equipmentUuid: string,
      data: CreateIncidentHistoryInput
    ): Promise<IncidentHistoryItem> => {
      const response = await apiClient.post(`/api/equipment/${equipmentUuid}/incident-history`, data);
      return transformSingleResponse<IncidentHistoryItem>(response);
    },

    deleteIncidentHistory: async (historyId: string): Promise<void> => {
      await apiClient.delete(`/api/equipment/incident-history/${historyId}`);
    },

    getCalibrationHistory: async (equipmentUuid: string): Promise<unknown[]> => {
      const response = await apiClient.get(`/api/calibrations?equipmentId=${equipmentUuid}`);
      // 타입 안전한 응답 데이터 추출
      const responseData: CalibrationHistoryResponse = response.data ?? response;
      return extractCalibrationItems(responseData);
    },
  };
}
