import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import type { PaginatedResponse } from './types';
import { transformPaginatedResponse } from './utils/response-transformers';
// ✅ SSOT: schemas 패키지에서 타입 import
import type {
  NonConformanceStatus,
  NonConformanceType,
  ResolutionType,
} from '@equipment-management/schemas';
// ✅ SSOT: schemas 패키지에서 라벨 import
import {
  NON_CONFORMANCE_STATUS_LABELS,
  NON_CONFORMANCE_TYPE_LABELS,
  RESOLUTION_TYPE_LABELS,
} from '@equipment-management/schemas';

// Re-export for backward compatibility
export type { NonConformanceStatus, NonConformanceType, ResolutionType };

// 관계 유저 인터페이스 (findAll with 절에서 반환)
export interface NCRelatedUser {
  id: string;
  name: string;
  email: string;
  team: { id: string; name: string } | null;
}

// 수리 이력 관계 인터페이스
export interface NCRepairHistory {
  id: string;
  repairDate: string;
  repairDescription: string;
  repairResult: string | null;
}

// 부적합 인터페이스
export interface NonConformance {
  id: string;
  equipmentId: string;
  discoveryDate: string;
  discoveredBy: string;
  cause: string;
  ncType: NonConformanceType;
  resolutionType: ResolutionType | null;
  repairHistoryId: string | null;
  calibrationId: string | null;
  actionPlan: string | null;
  analysisContent: string | null;
  correctionContent: string | null;
  correctionDate: string | null;
  correctedBy: string | null;
  status: NonConformanceStatus;
  closedBy: string | null;
  closedAt: string | null;
  closureNotes: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  // 관계 데이터 (findAll/findOne with 절에서 반환)
  equipment?: { id: string; name: string; managementNumber: string };
  repairHistory?: NCRepairHistory | null;
  discoverer?: NCRelatedUser | null;
  corrector?: NCRelatedUser | null;
  closer?: NCRelatedUser | null;
  rejector?: NCRelatedUser | null;
}

// 쿼리 인터페이스
export interface NonConformanceQuery {
  equipmentId?: string;
  status?: NonConformanceStatus;
  ncType?: NonConformanceType;
  site?: string;
  search?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

// 부적합 등록 DTO
export interface CreateNonConformanceDto {
  equipmentId: string;
  discoveryDate: string;
  discoveredBy: string;
  cause: string;
  ncType: NonConformanceType;
  actionPlan?: string;
}

// 부적합 업데이트 DTO (CAS: version 필수)
export interface UpdateNonConformanceDto {
  version: number;
  actionPlan?: string;
  analysisContent?: string;
  correctionContent?: string;
  correctionDate?: string;
  correctedBy?: string;
  status?: 'open' | 'analyzing' | 'corrected';
}

// 부적합 종료 DTO (closedBy는 서버에서 JWT로 추출)
export interface CloseNonConformanceDto {
  version: number;
  closureNotes?: string;
}

// ✅ Re-export labels from SSOT for backward compatibility
export { NON_CONFORMANCE_STATUS_LABELS, NON_CONFORMANCE_TYPE_LABELS, RESOLUTION_TYPE_LABELS };

// 부적합 API 객체
const nonConformancesApi = {
  // 부적합 목록 조회
  getNonConformances: async (
    query: NonConformanceQuery = {}
  ): Promise<PaginatedResponse<NonConformance>> => {
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const url = `${API_ENDPOINTS.NON_CONFORMANCES.LIST}${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get(url).then((res) => transformPaginatedResponse<NonConformance>(res));
  },

  // 부적합 상세 조회
  getNonConformance: async (id: string): Promise<NonConformance> => {
    return apiClient.get(API_ENDPOINTS.NON_CONFORMANCES.GET(id)).then((res) => res.data);
  },

  // 장비별 열린 부적합 조회
  getEquipmentNonConformances: async (equipmentUuid: string): Promise<NonConformance[]> => {
    return apiClient
      .get(API_ENDPOINTS.NON_CONFORMANCES.EQUIPMENT(equipmentUuid))
      .then((res) => res.data);
  },

  // 부적합 등록
  createNonConformance: async (data: CreateNonConformanceDto): Promise<NonConformance> => {
    return apiClient.post(API_ENDPOINTS.NON_CONFORMANCES.CREATE, data).then((res) => res.data);
  },

  // 부적합 업데이트 (원인분석/조치 기록)
  updateNonConformance: async (
    id: string,
    data: UpdateNonConformanceDto
  ): Promise<NonConformance> => {
    return apiClient.patch(API_ENDPOINTS.NON_CONFORMANCES.UPDATE(id), data).then((res) => res.data);
  },

  // 부적합 종료 (기술책임자)
  closeNonConformance: async (
    id: string,
    data: CloseNonConformanceDto
  ): Promise<NonConformance> => {
    return apiClient.patch(API_ENDPOINTS.NON_CONFORMANCES.CLOSE(id), data).then((res) => res.data);
  },

  // 부적합 조치 반려 (기술책임자: corrected → analyzing)
  rejectCorrection: async (
    id: string,
    data: { version: number; rejectionReason: string }
  ): Promise<NonConformance> => {
    return apiClient
      .patch(API_ENDPOINTS.NON_CONFORMANCES.REJECT_CORRECTION(id), data)
      .then((res) => res.data);
  },

  // 부적합 삭제 (소프트 삭제)
  deleteNonConformance: async (id: string): Promise<{ id: string; deleted: boolean }> => {
    return apiClient.delete(API_ENDPOINTS.NON_CONFORMANCES.DELETE(id)).then((res) => res.data);
  },

  // 종료 대기 중인 부적합 목록 (corrected 상태)
  getPendingCloseNonConformances: async (): Promise<PaginatedResponse<NonConformance>> => {
    return apiClient
      .get(`${API_ENDPOINTS.NON_CONFORMANCES.LIST}?status=corrected`)
      .then((res) => transformPaginatedResponse<NonConformance>(res));
  },
};

export default nonConformancesApi;
