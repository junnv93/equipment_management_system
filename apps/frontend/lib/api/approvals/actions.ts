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
import { ApprovalCategoryValues, type ApprovalCategory } from '@equipment-management/schemas';
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

const BULK_CONCURRENCY_LIMIT = 5;

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let nextIndex = 0;

  // worker pool: task 완료 즉시 다음을 grab — 항상 concurrency개 active
  async function worker() {
    while (nextIndex < tasks.length) {
      const i = nextIndex++;
      results[i] = await tasks[i]().then(
        (value) => ({ status: 'fulfilled' as const, value }),
        (reason: unknown) => ({ status: 'rejected' as const, reason })
      );
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker));
  return results;
}

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

export async function createDelegation(input: {
  delegatorId: string;
  delegateeId: string;
  category: ApprovalCategory;
  startsAt: string;
  endsAt: string;
  reason?: string;
}): Promise<void> {
  await apiClient.post(API_ENDPOINTS.APPROVALS.DELEGATIONS, input);
}

export async function revokeDelegation(id: string): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.APPROVALS.REVOKE_DELEGATION(id));
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
        opinion: comment ?? '',
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
        comment: comment || undefined,
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
        opinion: reason,
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
        comment: reason,
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

/**
 * Sprint 4.5 U-01: checkout 도메인은 backend bulk endpoint(`/checkouts/bulk-approve`,
 * `/checkouts/bulk-reject`)를 활용해 단일 HTTP 요청으로 처리. 다른 도메인은 기존
 * 클라이언트-side runWithConcurrency 패턴 유지.
 *
 * 이점:
 *   - HTTP round-trip N → 1 (네트워크 비용 감소)
 *   - AuditLog가 entityIdPath: 'body.ids'로 단일 기록 (bulk 액션 추적성)
 *   - backend Promise.allSettled가 partial failure 처리 (동등한 동작)
 *
 * 카테고리 SSOT: `ApprovalCategoryValues`(packages/schemas)에서 derive — 문자열
 * 리터럴 인라인 금지. schemas에서 카테고리 추가/이름 변경 시 자동 추적.
 */
const CHECKOUT_CATEGORIES = [
  ApprovalCategoryValues.OUTGOING,
  ApprovalCategoryValues.INCOMING,
] as const satisfies readonly ApprovalCategory[];

function isCheckoutCategory(category: ApprovalCategory): boolean {
  return (CHECKOUT_CATEGORIES as readonly ApprovalCategory[]).includes(category);
}

export async function bulkApprove(
  category: ApprovalCategory,
  ids: string[],
  comment?: string
): Promise<{ success: string[]; failed: string[] }> {
  // checkout 도메인: backend bulk endpoint 활용 (단일 HTTP 요청 + 통합 AuditLog)
  if (isCheckoutCategory(category)) {
    const result = await checkoutApi.bulkApproveCheckouts(ids, comment);
    return {
      success: result.approved.map((r) => r.id),
      failed: result.failed.map((r) => r.id),
    };
  }

  const itemsMap = await fetchItemsMapIfNeeded(category);

  // runWithConcurrency: 동시성 5 제한 배치 실행 + 부분 실패 허용
  // CAS 안전성: bulk 내 각 id는 서로 다른 엔티티이므로 버전 충돌 없음
  const results = await runWithConcurrency(
    ids.map((id) => () => {
      let equipmentId: string | undefined;
      let originalData: unknown;
      if (itemsMap) {
        const item = itemsMap.get(id);
        equipmentId = item?.details?.equipmentId as string | undefined;
        originalData = item?.originalData;
      }
      return approve(category, id, comment, equipmentId, originalData);
    }),
    BULK_CONCURRENCY_LIMIT
  );

  const success: string[] = [];
  const failed: string[] = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      success.push(ids[i]);
    } else {
      console.error('[ApprovalsApi] bulk approve item failed:', {
        id: ids[i],
        category,
        reason: result.reason,
      });
      failed.push(ids[i]);
    }
  });

  return { success, failed };
}

export async function bulkReject(
  category: ApprovalCategory,
  ids: string[],
  reason: string
): Promise<{ success: string[]; failed: string[] }> {
  // checkout 도메인: backend bulk endpoint 활용
  if (isCheckoutCategory(category)) {
    const result = await checkoutApi.bulkRejectCheckouts(ids, reason);
    return {
      success: result.rejected.map((r) => r.id),
      failed: result.failed.map((r) => r.id),
    };
  }

  const itemsMap = await fetchItemsMapIfNeeded(category);

  // runWithConcurrency: 동시성 5 제한 배치 실행 + 부분 실패 허용
  const results = await runWithConcurrency(
    ids.map((id) => () => {
      let equipmentId: string | undefined;
      let originalData: unknown;
      if (itemsMap) {
        const item = itemsMap.get(id);
        equipmentId = item?.details?.equipmentId as string | undefined;
        originalData = item?.originalData;
      }
      return reject(category, id, reason, equipmentId, originalData);
    }),
    BULK_CONCURRENCY_LIMIT
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
