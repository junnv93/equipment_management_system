import { apiClient } from './api-client';
import type { PaginatedResponse } from './types';
import { transformPaginatedResponse } from './utils/response-transformers';

// 교정계획서 상태 타입
export type CalibrationPlanStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';

// 장비 정보 (항목에 포함)
export interface EquipmentInfo {
  uuid: string;
  name: string;
  managementNumber: string;
  modelName: string | null;
  manufacturer: string | null;
  location: string | null;
  lastCalibrationDate: string | null;
  nextCalibrationDate: string | null;
  calibrationCycle: number | null;
  calibrationAgency: string | null;
}

// 교정계획서 항목 인터페이스
export interface CalibrationPlanItem {
  id: number;
  uuid: string;
  planId: number;
  equipmentId: number;
  sequenceNumber: number;
  // 현황 스냅샷
  snapshotValidityDate: string | null;
  snapshotCalibrationCycle: number | null;
  snapshotCalibrationAgency: string | null;
  // 계획
  plannedCalibrationDate: string | null;
  plannedCalibrationAgency: string | null;
  // 확인
  confirmedBy: string | null;
  confirmedAt: string | null;
  // 비고
  actualCalibrationDate: string | null;
  notes: string | null;
  // 시스템
  createdAt: string;
  updatedAt: string;
  // 조인된 장비 정보
  equipment?: EquipmentInfo;
}

// 교정계획서 인터페이스
export interface CalibrationPlan {
  id: number;
  uuid: string;
  year: number;
  siteId: string;
  teamId: string | null;
  status: CalibrationPlanStatus;
  createdBy: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  // 항목 (상세 조회 시)
  items?: CalibrationPlanItem[];
}

// 쿼리 인터페이스
export interface CalibrationPlanQuery {
  year?: number;
  siteId?: string;
  status?: CalibrationPlanStatus;
  page?: number;
  pageSize?: number;
}

// 외부교정 장비 쿼리
export interface ExternalEquipmentQuery {
  year?: number;
  siteId?: string;
}

// 외부교정 대상 장비 인터페이스
export interface ExternalEquipment {
  uuid: string;
  name: string;
  managementNumber: string;
  modelName: string | null;
  manufacturer: string | null;
  location: string | null;
  site: string;
  lastCalibrationDate: string | null;
  nextCalibrationDate: string | null;
  calibrationCycle: number | null;
  calibrationAgency: string | null;
}

// 계획서 생성 DTO
export interface CreateCalibrationPlanDto {
  year: number;
  siteId: string;
  teamId?: string;
  createdBy: string;
}

// 계획서 수정 DTO
export interface UpdateCalibrationPlanDto {
  teamId?: string;
}

// 항목 수정 DTO
export interface UpdateCalibrationPlanItemDto {
  plannedCalibrationAgency?: string;
  notes?: string;
}

// 승인 DTO
export interface ApproveCalibrationPlanDto {
  approvedBy: string;
}

// 반려 DTO
export interface RejectCalibrationPlanDto {
  rejectedBy: string;
  rejectionReason: string;
}

// 항목 확인 DTO
export interface ConfirmPlanItemDto {
  confirmedBy: string;
}

// 상태 라벨
export const CALIBRATION_PLAN_STATUS_LABELS: Record<CalibrationPlanStatus, string> = {
  draft: '작성 중',
  pending_approval: '승인 대기',
  approved: '승인됨',
  rejected: '반려됨',
};

// 상태 색상
export const CALIBRATION_PLAN_STATUS_COLORS: Record<CalibrationPlanStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

// 시험소 라벨
export const SITE_LABELS: Record<string, string> = {
  suwon: '수원',
  uiwang: '의왕',
};

// 교정계획서 API 객체
const calibrationPlansApi = {
  // 계획서 목록 조회
  getCalibrationPlans: async (
    query: CalibrationPlanQuery = {}
  ): Promise<PaginatedResponse<CalibrationPlan>> => {
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const url = `/api/calibration-plans${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get(url).then((res) => transformPaginatedResponse<CalibrationPlan>(res));
  },

  // 계획서 상세 조회 (항목 포함)
  getCalibrationPlan: async (uuid: string): Promise<CalibrationPlan> => {
    return apiClient.get(`/api/calibration-plans/${uuid}`).then((res) => res.data);
  },

  // 계획서 생성
  createCalibrationPlan: async (data: CreateCalibrationPlanDto): Promise<CalibrationPlan> => {
    return apiClient.post('/api/calibration-plans', data).then((res) => res.data);
  },

  // 계획서 수정
  updateCalibrationPlan: async (
    uuid: string,
    data: UpdateCalibrationPlanDto
  ): Promise<CalibrationPlan> => {
    return apiClient.patch(`/api/calibration-plans/${uuid}`, data).then((res) => res.data);
  },

  // 계획서 삭제
  deleteCalibrationPlan: async (uuid: string): Promise<{ uuid: string; deleted: boolean }> => {
    return apiClient.delete(`/api/calibration-plans/${uuid}`).then((res) => res.data);
  },

  // 승인 요청
  submitCalibrationPlan: async (uuid: string): Promise<CalibrationPlan> => {
    return apiClient.post(`/api/calibration-plans/${uuid}/submit`).then((res) => res.data);
  },

  // 승인
  approveCalibrationPlan: async (
    uuid: string,
    data: ApproveCalibrationPlanDto
  ): Promise<CalibrationPlan> => {
    return apiClient.patch(`/api/calibration-plans/${uuid}/approve`, data).then((res) => res.data);
  },

  // 반려
  rejectCalibrationPlan: async (
    uuid: string,
    data: RejectCalibrationPlanDto
  ): Promise<CalibrationPlan> => {
    return apiClient.patch(`/api/calibration-plans/${uuid}/reject`, data).then((res) => res.data);
  },

  // 항목 확인
  confirmPlanItem: async (
    planUuid: string,
    itemUuid: string,
    data: ConfirmPlanItemDto
  ): Promise<CalibrationPlanItem> => {
    return apiClient
      .patch(`/api/calibration-plans/${planUuid}/items/${itemUuid}/confirm`, data)
      .then((res) => res.data);
  },

  // 항목 수정
  updatePlanItem: async (
    planUuid: string,
    itemUuid: string,
    data: UpdateCalibrationPlanItemDto
  ): Promise<CalibrationPlanItem> => {
    return apiClient
      .patch(`/api/calibration-plans/${planUuid}/items/${itemUuid}`, data)
      .then((res) => res.data);
  },

  // 외부교정 대상 장비 조회
  getExternalEquipment: async (
    query: ExternalEquipmentQuery = {}
  ): Promise<ExternalEquipment[]> => {
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const url = `/api/calibration-plans/equipment/external${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get(url).then((res) => res.data);
  },

  // 승인 대기 계획서 목록
  getPendingApprovalPlans: async (): Promise<PaginatedResponse<CalibrationPlan>> => {
    return apiClient
      .get('/api/calibration-plans?status=pending_approval')
      .then((res) => transformPaginatedResponse<CalibrationPlan>(res));
  },

  // PDF 다운로드 (새 탭에서 HTML 열기 - 브라우저에서 인쇄하여 PDF 저장)
  openPrintView: (uuid: string): void => {
    const url = `/api/calibration-plans/${uuid}/pdf`;
    window.open(url, '_blank');
  },
};

export default calibrationPlansApi;
