import { apiClient } from './api-client';
import type { PaginatedResponse } from './types';
import { transformPaginatedResponse } from './utils/response-transformers';

// 부적합 상태 타입
export type NonConformanceStatus = 'open' | 'analyzing' | 'corrected' | 'closed';

// 부적합 인터페이스
export interface NonConformance {
  id: string;
  equipmentId: string;
  discoveryDate: string;
  discoveredBy: string;
  cause: string;
  actionPlan: string | null;
  analysisContent: string | null;
  correctionContent: string | null;
  correctionDate: string | null;
  correctedBy: string | null;
  status: NonConformanceStatus;
  closedBy: string | null;
  closedAt: string | null;
  closureNotes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// 쿼리 인터페이스
export interface NonConformanceQuery {
  equipmentId?: string;
  status?: NonConformanceStatus;
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
  actionPlan?: string;
}

// 부적합 업데이트 DTO
export interface UpdateNonConformanceDto {
  actionPlan?: string;
  analysisContent?: string;
  correctionContent?: string;
  correctionDate?: string;
  correctedBy?: string;
  status?: 'open' | 'analyzing' | 'corrected';
}

// 부적합 종료 DTO
export interface CloseNonConformanceDto {
  closedBy: string;
  closureNotes?: string;
}

// 상태 라벨
export const NON_CONFORMANCE_STATUS_LABELS: Record<NonConformanceStatus, string> = {
  open: '발견됨',
  analyzing: '분석 중',
  corrected: '조치 완료',
  closed: '종료됨',
};

// 상태 색상
export const NON_CONFORMANCE_STATUS_COLORS: Record<NonConformanceStatus, string> = {
  open: 'bg-red-100 text-red-800',
  analyzing: 'bg-yellow-100 text-yellow-800',
  corrected: 'bg-blue-100 text-blue-800',
  closed: 'bg-green-100 text-green-800',
};

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

    const url = `/api/non-conformances${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get(url).then((res) => transformPaginatedResponse<NonConformance>(res));
  },

  // 부적합 상세 조회
  getNonConformance: async (id: string): Promise<NonConformance> => {
    return apiClient.get(`/api/non-conformances/${id}`).then((res) => res.data);
  },

  // 장비별 열린 부적합 조회
  getEquipmentNonConformances: async (equipmentUuid: string): Promise<NonConformance[]> => {
    return apiClient
      .get(`/api/non-conformances/equipment/${equipmentUuid}`)
      .then((res) => res.data);
  },

  // 부적합 등록
  createNonConformance: async (data: CreateNonConformanceDto): Promise<NonConformance> => {
    return apiClient.post('/api/non-conformances', data).then((res) => res.data);
  },

  // 부적합 업데이트 (원인분석/조치 기록)
  updateNonConformance: async (
    id: string,
    data: UpdateNonConformanceDto
  ): Promise<NonConformance> => {
    return apiClient.patch(`/api/non-conformances/${id}`, data).then((res) => res.data);
  },

  // 부적합 종료 (기술책임자)
  closeNonConformance: async (
    id: string,
    data: CloseNonConformanceDto
  ): Promise<NonConformance> => {
    return apiClient.patch(`/api/non-conformances/${id}/close`, data).then((res) => res.data);
  },

  // 부적합 삭제 (소프트 삭제)
  deleteNonConformance: async (id: string): Promise<{ id: string; deleted: boolean }> => {
    return apiClient.delete(`/api/non-conformances/${id}`).then((res) => res.data);
  },

  // 종료 대기 중인 부적합 목록 (corrected 상태)
  getPendingCloseNonConformances: async (): Promise<PaginatedResponse<NonConformance>> => {
    return apiClient
      .get('/api/non-conformances?status=corrected')
      .then((res) => transformPaginatedResponse<NonConformance>(res));
  },
};

export default nonConformancesApi;
