import { apiClient } from './api-client';
import type { PaginatedResponse } from './types';
import { transformPaginatedResponse } from './utils/response-transformers';
// ✅ SSOT: packages/schemas에서 import
import type { CalibrationPlanStatus, Site } from '@equipment-management/schemas';
import {
  CALIBRATION_PLAN_STATUS_LABELS as SSOT_STATUS_LABELS,
  SITE_LABELS as SSOT_SITE_LABELS,
} from '@equipment-management/schemas';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';

// Re-export for backward compatibility
export type { CalibrationPlanStatus, Site };

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

// 교정계획서 인터페이스 (3단계 승인 워크플로우)
export interface CalibrationPlan {
  id: number;
  uuid: string;
  year: number;
  siteId: Site; // ✅ SSOT: Site 타입 사용
  teamId: string | null;
  status: CalibrationPlanStatus;
  // 작성자 정보
  createdBy: string;
  // 검토 요청 단계
  submittedAt: string | null;
  // 검토 단계 (품질책임자)
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewComment: string | null;
  // 승인 단계 (시험소장)
  approvedBy: string | null;
  approvedAt: string | null;
  // 반려 정보
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  rejectionStage: 'review' | 'approval' | null;
  // 버전 관리
  version: number;
  parentPlanId: string | null;
  isLatestVersion: boolean;
  // 시스템 필드
  createdAt: string;
  updatedAt: string;
  // 항목 (상세 조회 시)
  items?: CalibrationPlanItem[];
}

// 버전 히스토리 항목 인터페이스
export interface CalibrationPlanVersion {
  id: string;
  year: number;
  siteId: Site;
  status: CalibrationPlanStatus;
  version: number;
  isLatestVersion: boolean;
  createdBy: string;
  createdAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
}

// 쿼리 인터페이스 (API 요청용 - string 허용)
export interface CalibrationPlanQuery {
  year?: number;
  siteId?: string;
  status?: CalibrationPlanStatus;
  page?: number;
  pageSize?: number;
}

// 외부교정 장비 쿼리 (API 요청용 - string 허용)
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

// 검토 요청 DTO (기술책임자 → 품질책임자)
export interface SubmitForReviewDto {
  submittedBy: string;
  memo?: string;
}

// 검토 완료 DTO (품질책임자)
export interface ReviewCalibrationPlanDto {
  reviewedBy: string;
  reviewComment?: string;
}

// ✅ SSOT: packages/schemas의 라벨 재사용
export const CALIBRATION_PLAN_STATUS_LABELS = SSOT_STATUS_LABELS;

// 상태 색상 (UI 전용 - UL Solutions 브랜드 색상 적용)
export const CALIBRATION_PLAN_STATUS_COLORS: Record<CalibrationPlanStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending_review: 'bg-ul-orange/10 text-ul-orange border border-ul-orange/20',
  pending_approval: 'bg-ul-fog/10 text-ul-fog border border-ul-fog/20',
  approved: 'bg-ul-green/10 text-ul-green border border-ul-green/20',
  rejected: 'bg-ul-red/10 text-ul-red border border-ul-red/20',
};

// ✅ SSOT: packages/schemas의 라벨 재사용
// 타입 확장: API 응답의 siteId가 string이므로 Record<string, string>으로 캐스팅
export const SITE_LABELS: Record<string, string> = SSOT_SITE_LABELS;

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

    const url = `${API_ENDPOINTS.CALIBRATION_PLANS.LIST}${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get(url).then((res) => transformPaginatedResponse<CalibrationPlan>(res));
  },

  // 계획서 상세 조회 (항목 포함)
  getCalibrationPlan: async (uuid: string): Promise<CalibrationPlan> => {
    return apiClient.get(API_ENDPOINTS.CALIBRATION_PLANS.GET(uuid)).then((res) => res.data);
  },

  // 계획서 생성
  createCalibrationPlan: async (data: CreateCalibrationPlanDto): Promise<CalibrationPlan> => {
    return apiClient.post(API_ENDPOINTS.CALIBRATION_PLANS.CREATE, data).then((res) => res.data);
  },

  // 계획서 수정
  updateCalibrationPlan: async (
    uuid: string,
    data: UpdateCalibrationPlanDto
  ): Promise<CalibrationPlan> => {
    return apiClient
      .patch(API_ENDPOINTS.CALIBRATION_PLANS.UPDATE(uuid), data)
      .then((res) => res.data);
  },

  // 계획서 삭제
  deleteCalibrationPlan: async (uuid: string): Promise<{ uuid: string; deleted: boolean }> => {
    return apiClient.delete(API_ENDPOINTS.CALIBRATION_PLANS.DELETE(uuid)).then((res) => res.data);
  },

  // 승인 요청 (레거시)
  /** @deprecated submitForReview 사용 권장 */
  submitCalibrationPlan: async (uuid: string): Promise<CalibrationPlan> => {
    return apiClient.post(API_ENDPOINTS.CALIBRATION_PLANS.SUBMIT(uuid)).then((res) => res.data);
  },

  // 검토 요청 (기술책임자 → 품질책임자)
  submitForReview: async (uuid: string, data: SubmitForReviewDto): Promise<CalibrationPlan> => {
    return apiClient
      .post(API_ENDPOINTS.CALIBRATION_PLANS.SUBMIT_FOR_REVIEW(uuid), data)
      .then((res) => res.data);
  },

  // 검토 완료 (품질책임자)
  reviewCalibrationPlan: async (
    uuid: string,
    data: ReviewCalibrationPlanDto
  ): Promise<CalibrationPlan> => {
    return apiClient
      .patch(API_ENDPOINTS.CALIBRATION_PLANS.REVIEW(uuid), data)
      .then((res) => res.data);
  },

  // 최종 승인 (시험소장)
  approveCalibrationPlan: async (
    uuid: string,
    data: ApproveCalibrationPlanDto
  ): Promise<CalibrationPlan> => {
    return apiClient
      .patch(API_ENDPOINTS.CALIBRATION_PLANS.APPROVE(uuid), data)
      .then((res) => res.data);
  },

  // 반려 (품질책임자 또는 시험소장)
  rejectCalibrationPlan: async (
    uuid: string,
    data: RejectCalibrationPlanDto
  ): Promise<CalibrationPlan> => {
    return apiClient
      .patch(API_ENDPOINTS.CALIBRATION_PLANS.REJECT(uuid), data)
      .then((res) => res.data);
  },

  // 항목 확인
  confirmPlanItem: async (
    planUuid: string,
    itemUuid: string,
    data: ConfirmPlanItemDto
  ): Promise<CalibrationPlanItem> => {
    return apiClient
      .patch(API_ENDPOINTS.CALIBRATION_PLANS.CONFIRM_ITEM(planUuid, itemUuid), data)
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

  // 검토 대기 계획서 목록 (품질책임자용)
  getPendingReviewPlans: async (): Promise<PaginatedResponse<CalibrationPlan>> => {
    return apiClient
      .get(API_ENDPOINTS.CALIBRATION_PLANS.PENDING_REVIEW)
      .then((res) => transformPaginatedResponse<CalibrationPlan>(res));
  },

  // 승인 대기 계획서 목록 (시험소장용)
  getPendingApprovalPlans: async (): Promise<PaginatedResponse<CalibrationPlan>> => {
    return apiClient
      .get(API_ENDPOINTS.CALIBRATION_PLANS.PENDING_APPROVAL)
      .then((res) => transformPaginatedResponse<CalibrationPlan>(res));
  },

  // PDF 다운로드 (새 탭에서 HTML 열기 - 브라우저에서 인쇄하여 PDF 저장)
  openPrintView: (uuid: string): void => {
    const url = `/api/calibration-plans/${uuid}/pdf`;
    window.open(url, '_blank');
  },

  // 새 버전 생성 (승인된 계획서만)
  createNewVersion: async (uuid: string, createdBy: string): Promise<CalibrationPlan> => {
    return apiClient
      .post(`/api/calibration-plans/${uuid}/new-version`, { createdBy })
      .then((res) => res.data);
  },

  // 버전 히스토리 조회
  getVersionHistory: async (uuid: string): Promise<CalibrationPlanVersion[]> => {
    return apiClient.get(`/api/calibration-plans/${uuid}/versions`).then((res) => res.data);
  },
};

export default calibrationPlansApi;
