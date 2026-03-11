import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import type { PaginatedResponse } from './types';
import { transformPaginatedResponse } from './utils/response-transformers';
import type { SoftwareApprovalStatus } from '@equipment-management/schemas';

// 소프트웨어 타입
export type SoftwareType = 'measurement' | 'analysis' | 'control' | 'other';

export type { SoftwareApprovalStatus };

export interface SoftwareHistory {
  id: string;
  equipmentId: string;
  softwareName: string;
  previousVersion: string | null;
  newVersion: string;
  changedAt: string;
  changedBy: string;
  verificationRecord: string;
  approvalStatus: SoftwareApprovalStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  approverComment: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SoftwareHistoryQuery {
  equipmentId?: string;
  softwareName?: string;
  approvalStatus?: SoftwareApprovalStatus;
  search?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateSoftwareChangeDto {
  equipmentId: string;
  softwareName: string;
  previousVersion?: string;
  newVersion: string;
  verificationRecord: string;
}

export interface ApproveSoftwareChangeDto {
  approverComment: string;
  version: number;
}

export interface RejectSoftwareChangeDto {
  rejectionReason: string;
  version: number;
}

export interface EquipmentSoftwareInfo {
  equipmentId: string;
  equipmentName: string;
  softwareName: string | null;
  softwareVersion: string | null;
  softwareType: SoftwareType | null;
  lastUpdated: string | null;
}

export interface SoftwareRegistry {
  registry: EquipmentSoftwareInfo[];
  summary: {
    softwareName: string;
    equipmentCount: number;
    versions: (string | null)[];
  }[];
  totalEquipments: number;
  totalSoftwareTypes: number;
  generatedAt: string;
}

export interface EquipmentBySoftware {
  softwareName: string;
  equipments: {
    equipmentId: string;
    equipmentName: string;
    softwareVersion: string | null;
    softwareType: SoftwareType | null;
    lastUpdated: string | null;
  }[];
  count: number;
}

// 소프트웨어 타입 라벨
export const SOFTWARE_TYPE_LABELS: Record<SoftwareType, string> = {
  measurement: '측정 소프트웨어',
  analysis: '분석 소프트웨어',
  control: '제어 소프트웨어',
  other: '기타',
};

// 승인 상태 라벨
export const SOFTWARE_APPROVAL_STATUS_LABELS: Record<SoftwareApprovalStatus, string> = {
  pending: '승인 대기',
  approved: '승인됨',
  rejected: '반려됨',
};

// 소프트웨어 API 객체
const softwareApi = {
  // 소프트웨어 변경 요청
  createSoftwareChange: async (data: CreateSoftwareChangeDto): Promise<SoftwareHistory> => {
    return apiClient.post(API_ENDPOINTS.SOFTWARE.CHANGE_REQUEST, data).then((res) => res.data);
  },

  // 소프트웨어 변경 이력 조회
  getSoftwareHistory: async (
    query: SoftwareHistoryQuery = {}
  ): Promise<PaginatedResponse<SoftwareHistory>> => {
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const url = `${API_ENDPOINTS.SOFTWARE.HISTORY}${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get(url).then((res) => transformPaginatedResponse<SoftwareHistory>(res));
  },

  // 소프트웨어 변경 이력 상세 조회
  getSoftwareHistoryDetail: async (id: string): Promise<SoftwareHistory> => {
    return apiClient.get(API_ENDPOINTS.SOFTWARE.GET(id)).then((res) => res.data);
  },

  // 승인 대기 목록 조회
  getPendingSoftwareChanges: async (): Promise<PaginatedResponse<SoftwareHistory>> => {
    return apiClient
      .get(API_ENDPOINTS.SOFTWARE.PENDING)
      .then((res) => transformPaginatedResponse<SoftwareHistory>(res));
  },

  // 소프트웨어 통합 관리대장 조회
  getSoftwareRegistry: async (): Promise<SoftwareRegistry> => {
    return apiClient.get(API_ENDPOINTS.SOFTWARE.REGISTRY).then((res) => res.data);
  },

  // 특정 소프트웨어 사용 장비 목록 조회
  getEquipmentBySoftware: async (softwareName: string): Promise<EquipmentBySoftware> => {
    return apiClient
      .get(API_ENDPOINTS.SOFTWARE.EQUIPMENT_BY_SOFTWARE(softwareName))
      .then((res) => res.data);
  },

  // 소프트웨어 변경 승인
  approveSoftwareChange: async (
    id: string,
    data: ApproveSoftwareChangeDto
  ): Promise<SoftwareHistory> => {
    return apiClient.patch(API_ENDPOINTS.SOFTWARE.APPROVE(id), data).then((res) => res.data);
  },

  // 소프트웨어 변경 반려
  rejectSoftwareChange: async (
    id: string,
    data: RejectSoftwareChangeDto
  ): Promise<SoftwareHistory> => {
    return apiClient.patch(API_ENDPOINTS.SOFTWARE.REJECT(id), data).then((res) => res.data);
  },
};

export default softwareApi;
