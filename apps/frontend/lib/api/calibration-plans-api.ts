import { apiClient } from './api-client';
import type { PaginatedResponse } from './types';
import {
  transformPaginatedResponse,
  transformSingleResponse,
  transformArrayResponse,
} from './utils/response-transformers';
import { downloadFile } from './utils/download-file';
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
// SSOT: Backend equipment.id = uuid type → string
export interface EquipmentInfo {
  id: string;
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
// SSOT: Backend calibration_plan_items.id/planId/equipmentId = uuid type → string
export interface CalibrationPlanItem {
  id: string;
  planId: string;
  equipmentId: string;
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
// SSOT: Backend calibration_plans.id = uuid('id') → string
export interface CalibrationPlan {
  id: string;
  year: number;
  siteId: Site; // ✅ SSOT: Site 타입 사용
  teamId: string | null;
  status: CalibrationPlanStatus;
  // 작성자 정보
  createdBy: string;
  authorName: string | null;
  teamName: string | null;
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
  // CAS (동시 수정 방지)
  casVersion: number;
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

// 교정계획서 상태별 요약 통계
export interface CalibrationPlanSummary {
  total: number;
  draft: number;
  pending_review: number;
  pending_approval: number;
  approved: number;
  rejected: number;
}

// 쿼리 인터페이스
export interface CalibrationPlanQuery {
  year?: number;
  siteId?: string;
  status?: CalibrationPlanStatus;
  page?: number;
  pageSize?: number;
  includeSummary?: boolean;
}

// 외부교정 장비 쿼리 (API 요청용 - string 허용)
export interface ExternalEquipmentQuery {
  year?: number;
  siteId?: string;
  teamId?: string;
}

// 외부교정 대상 장비 인터페이스
// SSOT: Backend equipment.id = uuid type → string
export interface ExternalEquipment {
  id: string;
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

// ✅ DTOs: userId 제거 (서버에서 JWT 추출), casVersion 추가

// 계획서 생성 DTO
export interface CreateCalibrationPlanDto {
  year: number;
  siteId: string;
  teamId?: string;
}

// 계획서 수정 DTO
export interface UpdateCalibrationPlanDto {
  casVersion: number;
  teamId?: string;
}

// 항목 수정 DTO
export interface UpdateCalibrationPlanItemDto {
  plannedCalibrationAgency?: string;
  notes?: string;
}

// 검토 요청 DTO (기술책임자 → 품질책임자)
export interface SubmitForReviewDto {
  casVersion: number;
  memo?: string;
}

// 검토 완료 DTO (품질책임자)
export interface ReviewCalibrationPlanDto {
  casVersion: number;
  reviewComment?: string;
}

// 승인 DTO (시험소장)
export interface ApproveCalibrationPlanDto {
  casVersion: number;
}

// 반려 DTO (품질책임자 또는 시험소장)
export interface RejectCalibrationPlanDto {
  casVersion: number;
  rejectionReason: string;
}

// 항목 확인 DTO
export interface ConfirmPlanItemDto {
  casVersion: number;
}

/** @deprecated 프론트엔드에서는 i18n (calibration.planStatus.*) 사용 */
export const CALIBRATION_PLAN_STATUS_LABELS = SSOT_STATUS_LABELS;

// 상태 색상은 design-tokens에서 관리
// @see lib/design-tokens/components/calibration-plans.ts → CALIBRATION_PLAN_STATUS_BADGE_COLORS

/** @deprecated 프론트엔드에서는 useSiteLabels() (lib/i18n/use-enum-labels.ts) 사용 */
export const SITE_LABELS: Record<string, string> = SSOT_SITE_LABELS;

// 교정계획서 API 객체
const calibrationPlansApi = {
  // 계획서 목록 조회
  getCalibrationPlans: async (
    query: CalibrationPlanQuery = {}
  ): Promise<PaginatedResponse<CalibrationPlan, CalibrationPlanSummary>> => {
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const url = `${API_ENDPOINTS.CALIBRATION_PLANS.LIST}${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient
      .get(url)
      .then((res) => transformPaginatedResponse<CalibrationPlan, CalibrationPlanSummary>(res));
  },

  // 계획서 상세 조회 (항목 포함)
  getCalibrationPlan: async (uuid: string): Promise<CalibrationPlan> => {
    return apiClient
      .get(API_ENDPOINTS.CALIBRATION_PLANS.GET(uuid))
      .then((res) => transformSingleResponse<CalibrationPlan>(res));
  },

  // 계획서 생성
  createCalibrationPlan: async (data: CreateCalibrationPlanDto): Promise<CalibrationPlan> => {
    return apiClient
      .post(API_ENDPOINTS.CALIBRATION_PLANS.CREATE, data)
      .then((res) => transformSingleResponse<CalibrationPlan>(res));
  },

  // 계획서 수정
  updateCalibrationPlan: async (
    uuid: string,
    data: UpdateCalibrationPlanDto
  ): Promise<CalibrationPlan> => {
    return apiClient
      .patch(API_ENDPOINTS.CALIBRATION_PLANS.UPDATE(uuid), data)
      .then((res) => transformSingleResponse<CalibrationPlan>(res));
  },

  // 계획서 삭제
  deleteCalibrationPlan: async (uuid: string): Promise<{ id: string; deleted: boolean }> => {
    return apiClient
      .delete(API_ENDPOINTS.CALIBRATION_PLANS.DELETE(uuid))
      .then((res) => transformSingleResponse<{ id: string; deleted: boolean }>(res));
  },

  // 승인 요청 (레거시)
  /** @deprecated submitForReview 사용 권장 */
  submitCalibrationPlan: async (uuid: string): Promise<CalibrationPlan> => {
    return apiClient
      .post(API_ENDPOINTS.CALIBRATION_PLANS.SUBMIT(uuid))
      .then((res) => transformSingleResponse<CalibrationPlan>(res));
  },

  // 검토 요청 (기술책임자 → 품질책임자)
  submitForReview: async (uuid: string, data: SubmitForReviewDto): Promise<CalibrationPlan> => {
    return apiClient
      .post(API_ENDPOINTS.CALIBRATION_PLANS.SUBMIT_FOR_REVIEW(uuid), data)
      .then((res) => transformSingleResponse<CalibrationPlan>(res));
  },

  // 검토 완료 (품질책임자)
  reviewCalibrationPlan: async (
    uuid: string,
    data: ReviewCalibrationPlanDto
  ): Promise<CalibrationPlan> => {
    return apiClient
      .patch(API_ENDPOINTS.CALIBRATION_PLANS.REVIEW(uuid), data)
      .then((res) => transformSingleResponse<CalibrationPlan>(res));
  },

  // 최종 승인 (시험소장)
  approveCalibrationPlan: async (
    uuid: string,
    data: ApproveCalibrationPlanDto
  ): Promise<CalibrationPlan> => {
    return apiClient
      .patch(API_ENDPOINTS.CALIBRATION_PLANS.APPROVE(uuid), data)
      .then((res) => transformSingleResponse<CalibrationPlan>(res));
  },

  // 반려 (품질책임자 또는 시험소장)
  rejectCalibrationPlan: async (
    uuid: string,
    data: RejectCalibrationPlanDto
  ): Promise<CalibrationPlan> => {
    return apiClient
      .patch(API_ENDPOINTS.CALIBRATION_PLANS.REJECT(uuid), data)
      .then((res) => transformSingleResponse<CalibrationPlan>(res));
  },

  // 항목 확인
  confirmPlanItem: async (
    planUuid: string,
    itemUuid: string,
    data: ConfirmPlanItemDto
  ): Promise<CalibrationPlanItem> => {
    return apiClient
      .patch(API_ENDPOINTS.CALIBRATION_PLANS.CONFIRM_ITEM(planUuid, itemUuid), data)
      .then((res) => transformSingleResponse<CalibrationPlanItem>(res));
  },

  // 항목 수정
  updatePlanItem: async (
    planUuid: string,
    itemUuid: string,
    data: UpdateCalibrationPlanItemDto
  ): Promise<CalibrationPlanItem> => {
    return apiClient
      .patch(API_ENDPOINTS.CALIBRATION_PLANS.UPDATE_ITEM(planUuid, itemUuid), data)
      .then((res) => transformSingleResponse<CalibrationPlanItem>(res));
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

    const url = `${API_ENDPOINTS.CALIBRATION_PLANS.EXTERNAL_EQUIPMENT}${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get(url).then((res) => transformArrayResponse<ExternalEquipment>(res));
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

  // Excel 내보내기 (UL-QP-19-01 양식 기반 xlsx 다운로드)
  downloadExcel: async (uuid: string): Promise<void> => {
    await downloadFile({
      url: API_ENDPOINTS.CALIBRATION_PLANS.EXPORT(uuid),
      filename: `교정계획서_${uuid.slice(0, 8)}.xlsx`,
    });
  },

  // 새 버전 생성 (승인된 계획서만)
  createNewVersion: async (uuid: string): Promise<CalibrationPlan> => {
    return apiClient
      .post(API_ENDPOINTS.CALIBRATION_PLANS.NEW_VERSION(uuid))
      .then((res) => transformSingleResponse<CalibrationPlan>(res));
  },

  // 버전 히스토리 조회
  getVersionHistory: async (uuid: string): Promise<CalibrationPlanVersion[]> => {
    return apiClient
      .get(API_ENDPOINTS.CALIBRATION_PLANS.VERSION_HISTORY(uuid))
      .then((res) => transformArrayResponse<CalibrationPlanVersion>(res));
  },
};

export default calibrationPlansApi;
