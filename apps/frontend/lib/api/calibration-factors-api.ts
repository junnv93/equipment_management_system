import { apiClient } from './api-client';
import type { PaginatedResponse } from './types';
import { transformPaginatedResponse, transformSingleResponse } from './utils/response-transformers';
// ✅ SSOT: packages/schemas에서 import
import type {
  CalibrationFactorType,
  CalibrationFactorApprovalStatus,
} from '@equipment-management/schemas';
import {
  CALIBRATION_FACTOR_TYPE_LABELS,
  CALIBRATION_FACTOR_APPROVAL_STATUS_LABELS,
} from '@equipment-management/schemas';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { getSemanticStatusClasses } from '@/lib/design-tokens/brand';

// Re-export for backward compatibility
export type { CalibrationFactorType, CalibrationFactorApprovalStatus };

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
  version: number;
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
  approverComment: string;
  version: number;
}

export interface RejectCalibrationFactorDto {
  rejectionReason: string;
  version: number;
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

/** @deprecated 프론트엔드에서는 i18n (calibration.factorType.*) 사용 */
export const FACTOR_TYPE_LABELS = CALIBRATION_FACTOR_TYPE_LABELS;
/** @deprecated 프론트엔드에서는 i18n (calibration.factorApprovalStatus.*) 사용 */
export const APPROVAL_STATUS_LABELS = CALIBRATION_FACTOR_APPROVAL_STATUS_LABELS;

// 승인 상태 색상 — BRAND_CLASS_MATRIX에서 파생 (SSOT)
export const FACTOR_APPROVAL_STATUS_COLORS: Record<CalibrationFactorApprovalStatus, string> = {
  pending: getSemanticStatusClasses('warning'),
  approved: getSemanticStatusClasses('ok'),
  rejected: getSemanticStatusClasses('critical'),
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

    const url = `${API_ENDPOINTS.CALIBRATION_FACTORS.LIST}${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get(url).then((res) => transformPaginatedResponse<CalibrationFactor>(res));
  },

  // 장비별 현재 보정계수 조회
  getEquipmentFactors: async (equipmentUuid: string): Promise<EquipmentFactors> => {
    return apiClient
      .get(API_ENDPOINTS.CALIBRATION_FACTORS.EQUIPMENT(equipmentUuid))
      .then((res) => transformSingleResponse<EquipmentFactors>(res));
  },

  // 보정계수 상세 조회
  getCalibrationFactor: async (id: string): Promise<CalibrationFactor> => {
    return apiClient
      .get(API_ENDPOINTS.CALIBRATION_FACTORS.GET(id))
      .then((res) => transformSingleResponse<CalibrationFactor>(res));
  },

  // 보정계수 변경 요청
  createCalibrationFactor: async (data: CreateCalibrationFactorDto): Promise<CalibrationFactor> => {
    return apiClient
      .post(API_ENDPOINTS.CALIBRATION_FACTORS.CREATE, data)
      .then((res) => transformSingleResponse<CalibrationFactor>(res));
  },

  // 승인 대기 목록 조회
  getPendingCalibrationFactors: async (): Promise<PaginatedResponse<CalibrationFactor>> => {
    return apiClient
      .get(API_ENDPOINTS.CALIBRATION_FACTORS.PENDING)
      .then((res) => transformPaginatedResponse<CalibrationFactor>(res));
  },

  // 보정계수 대장 조회
  getCalibrationFactorRegistry: async (): Promise<CalibrationFactorRegistry> => {
    return apiClient
      .get(API_ENDPOINTS.CALIBRATION_FACTORS.REGISTRY)
      .then((res) => transformSingleResponse<CalibrationFactorRegistry>(res));
  },

  // 보정계수 승인
  approveCalibrationFactor: async (
    id: string,
    data: ApproveCalibrationFactorDto
  ): Promise<CalibrationFactor> => {
    return apiClient
      .patch(API_ENDPOINTS.CALIBRATION_FACTORS.APPROVE(id), data)
      .then((res) => transformSingleResponse<CalibrationFactor>(res));
  },

  // 보정계수 반려
  rejectCalibrationFactor: async (
    id: string,
    data: RejectCalibrationFactorDto
  ): Promise<CalibrationFactor> => {
    return apiClient
      .patch(API_ENDPOINTS.CALIBRATION_FACTORS.REJECT(id), data)
      .then((res) => transformSingleResponse<CalibrationFactor>(res));
  },

  // 보정계수 삭제 (소프트 삭제) — CAS version 쿼리 파라미터 포함
  deleteCalibrationFactor: async (
    id: string,
    version: number
  ): Promise<{ id: string; deleted: boolean }> => {
    return apiClient
      .delete(`${API_ENDPOINTS.CALIBRATION_FACTORS.DELETE(id)}?version=${version}`)
      .then((res) => transformSingleResponse<{ id: string; deleted: boolean }>(res));
  },
};

export default calibrationFactorsApi;
