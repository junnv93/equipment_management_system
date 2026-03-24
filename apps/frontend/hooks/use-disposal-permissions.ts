import { useAuth } from '@/hooks/use-auth';
import type { Equipment } from '@/lib/api/equipment-api';
import {
  EquipmentStatusValues as ESVal,
  type DisposalRequest,
  DisposalReviewStatusValues as DRSVal,
} from '@equipment-management/schemas';
import { Permission } from '@equipment-management/shared-constants';

/**
 * 폐기 진행 단계 계산 (SSOT)
 *
 * pending: step 1 (요청) is current
 * reviewed: steps 1-2 complete, step 3 (승인) is current
 * approved: all steps complete (currentStep > 3)
 * 요청 없음: 0
 */
export function getDisposalCurrentStep(disposalRequest?: DisposalRequest | null): number {
  if (!disposalRequest) return 0;
  if (disposalRequest.reviewStatus === DRSVal.PENDING) return 1;
  if (disposalRequest.reviewStatus === DRSVal.REVIEWED) return 3;
  return 4;
}

export function useDisposalPermissions(
  equipment: Equipment,
  disposalRequest?: DisposalRequest | null
) {
  const { user, can } = useAuth();

  // SSOT: Permission enum 기반 권한 체크 (hasRole 하드코딩 제거)
  const canRequestDisposal =
    can(Permission.REQUEST_DISPOSAL) && equipment.status === ESVal.AVAILABLE && !equipment.isShared;

  const canReviewDisposal =
    can(Permission.REVIEW_DISPOSAL) &&
    equipment.status === ESVal.PENDING_DISPOSAL &&
    disposalRequest?.reviewStatus === DRSVal.PENDING &&
    user?.teamId === equipment.teamId;

  const canApproveDisposal =
    can(Permission.APPROVE_DISPOSAL) &&
    equipment.status === ESVal.PENDING_DISPOSAL &&
    disposalRequest?.reviewStatus === DRSVal.REVIEWED;

  const canCancelDisposal =
    disposalRequest?.requestedBy === user?.id && disposalRequest?.reviewStatus === DRSVal.PENDING;

  const isReadOnly = equipment.status === ESVal.DISPOSED;

  // 폐기 관련 권한이 하나라도 있을 때만 폐기 버튼 영역 표시
  const hasAnyDisposalPermission =
    can(Permission.REQUEST_DISPOSAL) ||
    can(Permission.REVIEW_DISPOSAL) ||
    can(Permission.APPROVE_DISPOSAL);

  const showDisposalButton =
    hasAnyDisposalPermission &&
    equipment.status !== ESVal.TEMPORARY &&
    (equipment.status === ESVal.AVAILABLE ||
      equipment.status === ESVal.PENDING_DISPOSAL ||
      equipment.status === ESVal.DISPOSED);

  // Calculate current step for progress stepper (SSOT: getDisposalCurrentStep)
  const currentStep = getDisposalCurrentStep(disposalRequest);

  return {
    canRequestDisposal,
    canReviewDisposal,
    canApproveDisposal,
    canCancelDisposal,
    isReadOnly,
    showDisposalButton,
    currentStep,
    isRequester: disposalRequest?.requestedBy === user?.id,
  };
}
