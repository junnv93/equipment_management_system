import { apiClient } from './api-client';
import type { PaginatedResponse } from './types';
import { transformPaginatedResponse } from './utils/response-transformers';

// 보정계수 타입
export type CalibrationFactorType =
  | 'antenna_gain'
  | 'cable_loss'
  | 'path_loss'
  | 'amplifier_gain'
  | 'other';

// 보정계수 승인 상태
export type CalibrationFactorApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface CalibrationFactor {
  id: string;
  equipmentId: string;
  calibrationId: string | null;
  factorType: CalibrationFactorType;
  factorName: string;
  factorValue: number;
  unit: string;
  parameters: Record<string, unknown> | null;
  effectiveDate: string;
  expiryDate: string | null;
  approvalStatus: CalibrationFactorApprovalStatus;
  requestedBy: string;
  approvedBy: string | null;
  requestedAt: string;
  approvedAt: string | null;
  approverComment: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CalibrationFactorQuery {
  equipmentId?: string;
  approvalStatus?: CalibrationFactorApprovalStatus;
  factorType?: CalibrationFactorType;
  search?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateCalibrationFactorDto {
  equipmentId: string;
  calibrationId?: string;
  factorType: CalibrationFactorType;
  factorName: string;
  factorValue: number;
  unit: string;
  parameters?: Record<string, unknown>;
  effectiveDate: string;
  expiryDate?: string;
  requestedBy: string;
}

export interface ApproveCalibrationFactorDto {
  approverId: string;
  approverComment: string;
}

export interface RejectCalibrationFactorDto {
  approverId: string;
  rejectionReason: string;
}

export interface EquipmentFactors {
  equipmentId: string;
  factors: CalibrationFactor[];
  count: number;
}

export interface CalibrationFactorRegistry {
  registry: {
    equipmentId: string;
    factors: CalibrationFactor[];
    factorCount: number;
  }[];
  totalEquipments: number;
  totalFactors: number;
  generatedAt: string;
}

// 보정계수 타입 라벨
export const FACTOR_TYPE_LABELS: Record<CalibrationFactorType, string> = {
  antenna_gain: '안테나 이득',
  cable_loss: '케이블 손실',
  path_loss: '경로 손실',
  amplifier_gain: '증폭기 이득',
  other: '기타',
};

// 승인 상태 라벨
export const APPROVAL_STATUS_LABELS: Record<CalibrationFactorApprovalStatus, string> = {
  pending: '승인 대기',
  approved: '승인됨',
  rejected: '반려됨',
};

// 승인 상태 색상
export const APPROVAL_STATUS_COLORS: Record<CalibrationFactorApprovalStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

// 보정계수 API 객체
const calibrationFactorsApi = {
  // 보정계수 목록 조회
  getCalibrationFactors: async (
    query: CalibrationFactorQuery = {}
  ): Promise<PaginatedResponse<CalibrationFactor>> => {
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const url = `/api/calibration-factors${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get(url).then((res) => transformPaginatedResponse<CalibrationFactor>(res));
  },

  // 장비별 현재 보정계수 조회
  getEquipmentFactors: async (equipmentUuid: string): Promise<EquipmentFactors> => {
    return apiClient
      .get(`/api/calibration-factors/equipment/${equipmentUuid}`)
      .then((res) => res.data);
  },

  // 보정계수 상세 조회
  getCalibrationFactor: async (id: string): Promise<CalibrationFactor> => {
    return apiClient.get(`/api/calibration-factors/${id}`).then((res) => res.data);
  },

  // 보정계수 변경 요청
  createCalibrationFactor: async (data: CreateCalibrationFactorDto): Promise<CalibrationFactor> => {
    return apiClient.post('/api/calibration-factors', data).then((res) => res.data);
  },

  // 승인 대기 목록 조회
  getPendingCalibrationFactors: async (): Promise<PaginatedResponse<CalibrationFactor>> => {
    return apiClient
      .get('/api/calibration-factors/pending')
      .then((res) => transformPaginatedResponse<CalibrationFactor>(res));
  },

  // 보정계수 대장 조회
  getCalibrationFactorRegistry: async (): Promise<CalibrationFactorRegistry> => {
    return apiClient.get('/api/calibration-factors/registry').then((res) => res.data);
  },

  // 보정계수 승인
  approveCalibrationFactor: async (
    id: string,
    data: ApproveCalibrationFactorDto
  ): Promise<CalibrationFactor> => {
    return apiClient.patch(`/api/calibration-factors/${id}/approve`, data).then((res) => res.data);
  },

  // 보정계수 반려
  rejectCalibrationFactor: async (
    id: string,
    data: RejectCalibrationFactorDto
  ): Promise<CalibrationFactor> => {
    return apiClient.patch(`/api/calibration-factors/${id}/reject`, data).then((res) => res.data);
  },

  // 보정계수 삭제 (소프트 삭제)
  deleteCalibrationFactor: async (id: string): Promise<{ id: string; deleted: boolean }> => {
    return apiClient.delete(`/api/calibration-factors/${id}`).then((res) => res.data);
  },
};

export default calibrationFactorsApi;
