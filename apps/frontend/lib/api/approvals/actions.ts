/**
 * approvals 도메인 액션(승인/반려) 함수
 *
 * approve, reject, bulkApprove, bulkReject.
 * 의존성: types.ts, fetchers.ts (bulk 타입 판별 전용), 외부 API 클라이언트
 *
 * CAS 버전 정책: 항상 최신 detail을 조회하여 CAS 버전을 사용.
 * 이유: 승인/반려는 상태 전이 액션으로 사용자 편집 데이터가 없음.
 * 리스트 캐시의 stale 버전 사용 시 다단계 승인에서 VERSION_CONFLICT 발생.
 */

import { apiClient } from '../api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { type ApprovalCategory } from '@equipment-management/schemas';
import calibrationApi from '../calibration-api';
import checkoutApi from '../checkout-api';
import nonConformancesApi from '../non-conformances-api';
import equipmentImportApi from '../equipment-import-api';
import { softwareValidationApi } from '../software-api';
import calibrationPlansApi from '../calibration-plans-api';
import { reviewDisposal, approveDisposal, getCurrentDisposalRequest } from '../disposal-api';
import equipmentApi from '../equipment-api';
import type { ApprovalItem } from './types';
import { getPendingItems } from './fetchers';
import { isCheckout, isEquipmentImport } from './mappers';
import type { SelfInspectionDetail } from './internal-rows';

// ============================================================================
// 내부 상수
// ============================================================================

/**
 * bulk approve/reject 시 타입 판별 또는 equipmentId가 필요한 카테고리
 *
 * CAS 버전은 approve/reject 내부에서 항상 최신 detail을 조회하므로 여기서 불필요.
 * originalData는 타입 판별(incoming: checkout vs import)과
 * equipmentId 추출(disposal)에만 사용됩니다.
 */
const ORIGINAL_DATA_REQUIRED_CATEGORIES = new Set<ApprovalCategory>([
  'incoming',
  'disposal_review',
  'disposal_final',
]);

// ============================================================================
// 헬퍼
// ============================================================================

export async function fetchItemsMapIfNeeded(
  category: ApprovalCategory
): Promise<Map<string, ApprovalItem> | undefined> {
  if (!ORIGINAL_DATA_REQUIRED_CATEGORIES.has(category)) return undefined;
  const items = await getPendingItems(category);
  return new Map(items.map((item) => [item.id, item]));
}

// ============================================================================
// 승인 처리
// ============================================================================

export async function approve(
  category: ApprovalCategory,
  id: string,
  comment?: string,
  equipmentId?: string,
  originalData?: unknown
): Promise<void> {
  switch (category) {
    case 'outgoing': {
      const checkoutMeta = isCheckout(originalData)
        ? originalData.meta?.availableActions
        : undefined;
      const { version } = await checkoutApi.getCheckout(id);
      if (checkoutMeta?.canBorrowerApprove) {
        await checkoutApi.borrowerApproveCheckout(id, version, comment);
      } else {
        await checkoutApi.approveCheckout(id, version, comment);
      }
      break;
    }

    case 'incoming':
      if (isCheckout(originalData)) {
        const { version } = await checkoutApi.getCheckout(id);
        await checkoutApi.approveReturn(id, { version, comment });
      } else if (isEquipmentImport(originalData)) {
        const { version } = await equipmentImportApi.getOne(id);
        await equipmentImportApi.approve(id, version, comment);
      } else {
        throw new Error('Unknown incoming item type');
      }
      break;

    case 'equipment': {
      const { version: eqVersion } = await equipmentApi.getRequestByUuid(id);
      await equipmentApi.approveRequest(id, eqVersion);
      break;
    }
    case 'calibration': {
      const { version: calVersion } = await calibrationApi.getCalibration(id);
      await calibrationApi.approveCalibration(id, {
        version: calVersion,
        approverComment: comment || undefined,
      });
      break;
    }
    case 'inspection':
      await apiClient.post(API_ENDPOINTS.CALIBRATIONS.INTERMEDIATE_CHECKS.COMPLETE(id), {
        comment,
      });
      break;
    case 'self_inspection': {
      const selfInspResponse = await apiClient.get<SelfInspectionDetail>(
        API_ENDPOINTS.SELF_INSPECTIONS.GET(id)
      );
      await apiClient.patch(API_ENDPOINTS.SELF_INSPECTIONS.APPROVE(id), {
        version: selfInspResponse.data.version,
      });
      break;
    }
    case 'nonconformity': {
      const { version: ncVersion } = await nonConformancesApi.getNonConformance(id);
      await nonConformancesApi.closeNonConformance(id, {
        version: ncVersion,
        closureNotes: comment,
      });
      break;
    }
    case 'disposal_review': {
      if (!equipmentId) throw new Error('equipmentId is required for disposal review');
      const disposalReview = await getCurrentDisposalRequest(equipmentId);
      if (disposalReview?.version === undefined) throw new Error('Disposal request not found');
      await reviewDisposal(equipmentId, {
        version: disposalReview.version,
        decision: 'approve',
        opinion: comment || 'Approved',
      });
      break;
    }
    case 'disposal_final': {
      if (!equipmentId) throw new Error('equipmentId is required for disposal approval');
      const disposalFinal = await getCurrentDisposalRequest(equipmentId);
      if (disposalFinal?.version === undefined) throw new Error('Disposal request not found');
      await approveDisposal(equipmentId, {
        version: disposalFinal.version,
        decision: 'approve',
        comment: comment || 'Approved',
      });
      break;
    }
    case 'plan_review': {
      const { casVersion: reviewCasVersion } = await calibrationPlansApi.getCalibrationPlan(id);
      await calibrationPlansApi.reviewCalibrationPlan(id, {
        casVersion: reviewCasVersion,
        reviewComment: comment || undefined,
      });
      break;
    }
    case 'plan_final': {
      const { casVersion: approveCasVersion } = await calibrationPlansApi.getCalibrationPlan(id);
      await calibrationPlansApi.approveCalibrationPlan(id, {
        casVersion: approveCasVersion,
      });
      break;
    }
    case 'software_validation': {
      const validation = await softwareValidationApi.get(id);
      await softwareValidationApi.approve(id, validation.version, comment || undefined);
      break;
    }
    default:
      throw new Error(`Unsupported category: ${category}`);
  }
}

// ============================================================================
// 반려 처리
// ============================================================================

export async function reject(
  category: ApprovalCategory,
  id: string,
  reason: string,
  equipmentId?: string,
  originalData?: unknown
): Promise<void> {
  switch (category) {
    case 'outgoing': {
      const checkoutMeta = isCheckout(originalData)
        ? originalData.meta?.availableActions
        : undefined;
      const { version } = await checkoutApi.getCheckout(id);
      if (checkoutMeta?.canBorrowerReject) {
        await checkoutApi.borrowerRejectCheckout(id, version, reason);
      } else {
        await checkoutApi.rejectCheckout(id, version, reason);
      }
      break;
    }

    case 'incoming':
      if (isCheckout(originalData)) {
        const { version } = await checkoutApi.getCheckout(id);
        await checkoutApi.rejectReturn(id, { version, reason });
      } else if (isEquipmentImport(originalData)) {
        const { version } = await equipmentImportApi.getOne(id);
        await equipmentImportApi.reject(id, version, reason);
      } else {
        throw new Error('Unknown incoming item type');
      }
      break;

    case 'equipment': {
      const { version: eqRejectVersion } = await equipmentApi.getRequestByUuid(id);
      await equipmentApi.rejectRequest(id, reason, eqRejectVersion);
      break;
    }
    case 'calibration': {
      const { version: calVersion } = await calibrationApi.getCalibration(id);
      await calibrationApi.rejectCalibration(id, {
        version: calVersion,
        rejectionReason: reason,
      });
      break;
    }
    case 'inspection':
      throw new Error('Inspection items cannot be rejected.');
    case 'self_inspection': {
      const selfInspRejectResponse = await apiClient.get<SelfInspectionDetail>(
        API_ENDPOINTS.SELF_INSPECTIONS.GET(id)
      );
      await apiClient.patch(API_ENDPOINTS.SELF_INSPECTIONS.REJECT(id), {
        version: selfInspRejectResponse.data.version,
        rejectionReason: reason,
      });
      break;
    }
    case 'nonconformity': {
      const { version: ncRejectVersion } = await nonConformancesApi.getNonConformance(id);
      await nonConformancesApi.rejectCorrection(id, {
        version: ncRejectVersion,
        rejectionReason: reason,
      });
      break;
    }
    case 'disposal_review': {
      if (!equipmentId) throw new Error('equipmentId is required for disposal review');
      const disposalReview = await getCurrentDisposalRequest(equipmentId);
      if (disposalReview?.version === undefined) throw new Error('Disposal request not found');
      await reviewDisposal(equipmentId, {
        version: disposalReview.version,
        decision: 'reject',
        opinion: reason || 'Rejected',
      });
      break;
    }
    case 'disposal_final': {
      if (!equipmentId) throw new Error('equipmentId is required for disposal approval');
      const disposalFinal = await getCurrentDisposalRequest(equipmentId);
      if (disposalFinal?.version === undefined) throw new Error('Disposal request not found');
      await approveDisposal(equipmentId, {
        version: disposalFinal.version,
        decision: 'reject',
        comment: reason || 'Rejected',
      });
      break;
    }
    case 'plan_review':
    case 'plan_final': {
      const { casVersion: rejectCasVersion } = await calibrationPlansApi.getCalibrationPlan(id);
      await calibrationPlansApi.rejectCalibrationPlan(id, {
        casVersion: rejectCasVersion,
        rejectionReason: reason,
      });
      break;
    }
    case 'software_validation': {
      const svForReject = await softwareValidationApi.get(id);
      await softwareValidationApi.reject(id, svForReject.version, reason);
      break;
    }
    default:
      throw new Error(`Unsupported category: ${category}`);
  }
}

// ============================================================================
// 일괄 처리
// ============================================================================

export async function bulkApprove(
  category: ApprovalCategory,
  ids: string[],
  comment?: string
): Promise<{ success: string[]; failed: string[] }> {
  const success: string[] = [];
  const failed: string[] = [];

  const itemsMap = await fetchItemsMapIfNeeded(category);

  for (const id of ids) {
    try {
      let equipmentId: string | undefined;
      let originalData: unknown;
      if (itemsMap) {
        const item = itemsMap.get(id);
        equipmentId = item?.details?.equipmentId as string | undefined;
        originalData = item?.originalData;
      }
      await approve(category, id, comment, equipmentId, originalData);
      success.push(id);
    } catch (error) {
      console.error('[ApprovalsApi] bulk approve item failed:', { id, category, error });
      failed.push(id);
    }
  }

  return { success, failed };
}

export async function bulkReject(
  category: ApprovalCategory,
  ids: string[],
  reason: string
): Promise<{ success: string[]; failed: string[] }> {
  const itemsMap = await fetchItemsMapIfNeeded(category);

  // Promise.allSettled: 병렬 실행 + 부분 실패 허용
  const results = await Promise.allSettled(
    ids.map((id) => {
      let equipmentId: string | undefined;
      let originalData: unknown;
      if (itemsMap) {
        const item = itemsMap.get(id);
        equipmentId = item?.details?.equipmentId as string | undefined;
        originalData = item?.originalData;
      }
      return reject(category, id, reason, equipmentId, originalData);
    })
  );

  const success: string[] = [];
  const failed: string[] = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      success.push(ids[i]);
    } else {
      failed.push(ids[i]);
    }
  });

  return { success, failed };
}
