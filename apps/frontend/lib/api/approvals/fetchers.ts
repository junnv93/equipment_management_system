/**
 * approvals 도메인 조회(fetch) 함수
 *
 * 카테고리별 대기 목록, 카운트, KPI 조회.
 * 의존성: types.ts, mappers.ts, internal-rows.ts, 외부 API 클라이언트
 * actions.ts를 import하지 않음 (순환 의존 차단).
 */

import { apiClient } from '../api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import {
  type ApprovalCategory,
  type UserRole,
  EquipmentImportStatusValues as EIStVal,
  LENDER_APPROVAL_PENDING_STATUSES,
} from '@equipment-management/schemas';
import calibrationApi, { type Calibration } from '../calibration-api';
import checkoutApi, { type Checkout } from '../checkout-api';
import nonConformancesApi, { type NonConformance } from '../non-conformances-api';
import equipmentImportApi, { type EquipmentImport } from '../equipment-import-api';
import { transformArrayResponse, transformSingleResponse } from '../utils/response-transformers';
import type { ApprovalItem, PendingCountsByCategory, ApprovalKpiResponse } from './types';
import type {
  CalibrationPlanApprovalRow,
  SoftwareValidationApprovalRow,
  InspectionApprovalRow,
  SelfInspectionApprovalRow,
  EquipmentRequestApprovalRow,
  DisposalApprovalRow,
} from './internal-rows';
import {
  mapCalibrationToApprovalItem,
  mapCheckoutToApprovalItem,
  mapPlanToApprovalItem,
  mapSoftwareToApprovalItem,
  mapNonConformanceToApprovalItem,
  mapInspectionToApprovalItem,
  mapSelfInspectionToApprovalItem,
  mapDisposalToApprovalItem,
  mapEquipmentRequestToApprovalItem,
  mapEquipmentImportToApprovalItem,
} from './mappers';

// ============================================================================
// 카테고리별 대기 목록 조회
// ============================================================================

export async function getPendingItems(
  category: ApprovalCategory,
  teamId?: string
): Promise<ApprovalItem[]> {
  switch (category) {
    case 'outgoing':
      return getPendingOutgoing(teamId);
    case 'incoming':
      return getPendingIncoming(teamId);
    case 'equipment':
      return getPendingEquipmentApprovals(teamId);
    case 'calibration':
      return getPendingCalibrations(teamId);
    case 'inspection':
      return getPendingInspections(teamId);
    case 'self_inspection':
      return getPendingSelfInspections(teamId);
    case 'nonconformity':
      return getPendingNonConformities();
    case 'disposal_review':
      return getPendingDisposalReviews();
    case 'disposal_final':
      return getPendingDisposalFinals();
    case 'plan_review':
      return getPendingPlanReviews();
    case 'plan_final':
      return getPendingPlanFinals();
    case 'software_validation':
      return getPendingSoftwareApprovals();
    default:
      return [];
  }
}

/**
 * 반출 승인 대기 목록 조회 (통합)
 *
 * Regular checkouts + equipment being returned to vendors (return_to_vendor).
 * 팀 필터링: 백엔드에서 역할 기반 자동 필터링
 */
async function getPendingOutgoing(_teamId?: string): Promise<ApprovalItem[]> {
  try {
    const [regularCheckouts, vendorReturns] = await Promise.all([
      checkoutApi.getCheckouts({
        statuses: LENDER_APPROVAL_PENDING_STATUSES.join(','),
        direction: 'outbound',
      }),
      checkoutApi.getCheckouts({
        statuses: 'pending',
        purpose: 'return_to_vendor',
        direction: 'outbound',
      }),
    ]);

    const regularItems = (regularCheckouts.data || []).map((item: Checkout) =>
      mapCheckoutToApprovalItem(item, 'outgoing')
    );

    const vendorReturnItems = (vendorReturns.data || []).map((item: Checkout) =>
      mapCheckoutToApprovalItem(item, 'outgoing')
    );

    return [...regularItems, ...vendorReturnItems];
  } catch (error) {
    console.error('[ApprovalsApi] getPendingOutgoing failed:', error);
    return [];
  }
}

/**
 * 반입 승인 대기 목록 조회 (통합)
 *
 * Combines: returns from calibration/repair, rental imports, shared imports.
 */
async function getPendingIncoming(_teamId?: string): Promise<ApprovalItem[]> {
  try {
    const [returns, rentalImports, sharedImports] = await Promise.all([
      checkoutApi.getPendingReturnApprovals(),
      equipmentImportApi.getList({ status: EIStVal.PENDING, sourceType: 'rental' }),
      equipmentImportApi.getList({ status: EIStVal.PENDING, sourceType: 'internal_shared' }),
    ]);

    const returnItems = (returns.data || []).map((item: Checkout) =>
      mapCheckoutToApprovalItem(item, 'incoming')
    );

    const rentalItems = (rentalImports.data || []).map((item: EquipmentImport) =>
      mapEquipmentImportToApprovalItem(item, 'incoming')
    );

    const sharedItems = (sharedImports.data || []).map((item: EquipmentImport) =>
      mapEquipmentImportToApprovalItem(item, 'incoming')
    );

    return [...returnItems, ...rentalItems, ...sharedItems];
  } catch (error) {
    console.error('[ApprovalsApi] getPendingIncoming failed:', error);
    return [];
  }
}

async function getPendingCalibrations(_teamId?: string): Promise<ApprovalItem[]> {
  try {
    const response = await calibrationApi.getPendingCalibrations();
    const items = response.data || [];
    return items.map((item: Calibration) => mapCalibrationToApprovalItem(item));
  } catch (error) {
    console.error('[ApprovalsApi] getPendingCalibrations failed:', error);
    return [];
  }
}

async function getPendingPlanReviews(): Promise<ApprovalItem[]> {
  try {
    const response = await apiClient.get(API_ENDPOINTS.CALIBRATION_PLANS.PENDING_REVIEW);
    const items = transformArrayResponse<CalibrationPlanApprovalRow>(response);
    return items.map((item) => mapPlanToApprovalItem(item, 'plan_review'));
  } catch (error) {
    console.error('[ApprovalsApi] getPendingPlanReviews failed:', error);
    return [];
  }
}

async function getPendingPlanFinals(): Promise<ApprovalItem[]> {
  try {
    const response = await apiClient.get(API_ENDPOINTS.CALIBRATION_PLANS.PENDING_APPROVAL);
    const items = transformArrayResponse<CalibrationPlanApprovalRow>(response);
    return items.map((item) => mapPlanToApprovalItem(item, 'plan_final'));
  } catch (error) {
    console.error('[ApprovalsApi] getPendingPlanFinals failed:', error);
    return [];
  }
}

async function getPendingEquipmentApprovals(_teamId?: string): Promise<ApprovalItem[]> {
  try {
    const response = await apiClient.get(API_ENDPOINTS.EQUIPMENT.REQUESTS.PENDING);
    const items = transformArrayResponse<EquipmentRequestApprovalRow>(response);
    return items.map((item) => mapEquipmentRequestToApprovalItem(item));
  } catch (error) {
    console.error('[ApprovalsApi] getPendingEquipmentApprovals failed:', error);
    return [];
  }
}

async function getPendingSoftwareApprovals(): Promise<ApprovalItem[]> {
  try {
    const response = await apiClient.get(API_ENDPOINTS.SOFTWARE_VALIDATIONS.PENDING);
    const items = transformArrayResponse<SoftwareValidationApprovalRow>(response);
    return items.map((item) => mapSoftwareToApprovalItem(item));
  } catch (error) {
    console.error('[ApprovalsApi] getPendingSoftwareApprovals failed:', error);
    return [];
  }
}

async function getPendingNonConformities(): Promise<ApprovalItem[]> {
  try {
    const response = await nonConformancesApi.getPendingCloseNonConformances();
    const items = response.data || [];
    return items.map((item: NonConformance) => mapNonConformanceToApprovalItem(item));
  } catch (error) {
    console.error('[ApprovalsApi] getPendingNonConformities failed:', error);
    return [];
  }
}

async function getPendingInspections(teamId?: string): Promise<ApprovalItem[]> {
  try {
    const params = new URLSearchParams({ status: 'due' });
    if (teamId) params.set('teamId', teamId);
    const response = await apiClient.get(
      `${API_ENDPOINTS.CALIBRATIONS.INTERMEDIATE_CHECKS.ALL}?${params.toString()}`
    );
    const items = transformArrayResponse<InspectionApprovalRow>(response);
    return items.map((item) => mapInspectionToApprovalItem(item));
  } catch (error) {
    console.error('[ApprovalsApi] getPendingInspections failed:', error);
    return [];
  }
}

async function getPendingSelfInspections(teamId?: string): Promise<ApprovalItem[]> {
  try {
    const params = new URLSearchParams();
    if (teamId) params.set('teamId', teamId);
    const url =
      params.size > 0
        ? `${API_ENDPOINTS.SELF_INSPECTIONS.PENDING_APPROVAL}?${params.toString()}`
        : API_ENDPOINTS.SELF_INSPECTIONS.PENDING_APPROVAL;
    const response = await apiClient.get(url);
    const items = transformArrayResponse<SelfInspectionApprovalRow>(response);
    return items.map((item) => mapSelfInspectionToApprovalItem(item));
  } catch (error) {
    console.error('[ApprovalsApi] getPendingSelfInspections failed:', error);
    return [];
  }
}

async function getPendingDisposalReviews(): Promise<ApprovalItem[]> {
  try {
    const response = await apiClient.get(API_ENDPOINTS.EQUIPMENT.DISPOSAL.PENDING_REVIEW);
    const items = transformArrayResponse<DisposalApprovalRow>(response);
    return items.map((item) => mapDisposalToApprovalItem(item, 'disposal_review'));
  } catch (error) {
    console.error('[ApprovalsApi] getPendingDisposalReviews failed:', error);
    return [];
  }
}

async function getPendingDisposalFinals(): Promise<ApprovalItem[]> {
  try {
    const response = await apiClient.get(API_ENDPOINTS.EQUIPMENT.DISPOSAL.PENDING_APPROVAL);
    const items = transformArrayResponse<DisposalApprovalRow>(response);
    return items.map((item) => mapDisposalToApprovalItem(item, 'disposal_final'));
  } catch (error) {
    console.error('[ApprovalsApi] getPendingDisposalFinals failed:', error);
    return [];
  }
}

// ============================================================================
// 집계 조회
// ============================================================================

/**
 * 카테고리별 대기 개수 조회
 *
 * ✅ SSOT: 백엔드 통합 API 사용 (13 serial API calls → 1 API call)
 */
export async function getPendingCounts(_role?: UserRole): Promise<PendingCountsByCategory> {
  try {
    const response = await apiClient.get(API_ENDPOINTS.APPROVALS.COUNTS);
    return transformSingleResponse<PendingCountsByCategory>(response) ?? getEmptyCounts();
  } catch (error) {
    console.error('Failed to fetch approval counts:', error);
    return getEmptyCounts();
  }
}

/**
 * 승인 KPI 조회 — 서버 사이드 집계
 */
export async function getKpi(category?: string): Promise<ApprovalKpiResponse> {
  try {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    const response = await apiClient.get(`${API_ENDPOINTS.APPROVALS.KPI}${params}`);
    return (
      transformSingleResponse<ApprovalKpiResponse>(response) ?? {
        todayProcessed: 0,
        urgentCount: 0,
        avgWaitDays: 0,
      }
    );
  } catch (error) {
    console.error('[ApprovalsApi] getKpi failed:', error);
    return { todayProcessed: 0, urgentCount: 0, avgWaitDays: 0 };
  }
}

export function getEmptyCounts(): PendingCountsByCategory {
  return {
    outgoing: 0,
    incoming: 0,
    equipment: 0,
    calibration: 0,
    inspection: 0,
    self_inspection: 0,
    nonconformity: 0,
    disposal_review: 0,
    disposal_final: 0,
    plan_review: 0,
    plan_final: 0,
    software_validation: 0,
  };
}
