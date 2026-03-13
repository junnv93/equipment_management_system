import { useAuth } from '@/hooks/use-auth';
import type { Equipment } from '@/lib/api/equipment-api';
import {
  EquipmentStatusValues as ESVal,
  type DisposalRequest,
  UserRoleValues as URVal,
  DisposalReviewStatusValues as DRSVal,
} from '@equipment-management/schemas';

export function useDisposalPermissions(
  equipment: Equipment,
  disposalRequest?: DisposalRequest | null
) {
  const { user, hasRole, isAdmin } = useAuth();

  const canRequestDisposal =
    hasRole([
      URVal.TEST_ENGINEER,
      URVal.TECHNICAL_MANAGER,
      URVal.LAB_MANAGER,
      URVal.SYSTEM_ADMIN,
    ]) &&
    equipment.status === ESVal.AVAILABLE &&
    !equipment.isShared;

  const canReviewDisposal =
    hasRole([URVal.TECHNICAL_MANAGER]) &&
    equipment.status === ESVal.PENDING_DISPOSAL &&
    disposalRequest?.reviewStatus === DRSVal.PENDING &&
    user?.teamId === equipment.teamId;

  const canApproveDisposal =
    isAdmin() &&
    equipment.status === ESVal.PENDING_DISPOSAL &&
    disposalRequest?.reviewStatus === DRSVal.REVIEWED;

  const canCancelDisposal =
    disposalRequest?.requestedBy === user?.id && disposalRequest?.reviewStatus === DRSVal.PENDING;

  const isReadOnly = equipment.status === ESVal.DISPOSED;

  const showDisposalButton =
    equipment.status !== ESVal.TEMPORARY &&
    (equipment.status === ESVal.AVAILABLE ||
      equipment.status === ESVal.PENDING_DISPOSAL ||
      equipment.status === ESVal.DISPOSED);

  // Calculate current step for progress stepper
  // pending: step 1 (요청) is current
  // reviewed: steps 1-2 complete, step 3 (승인) is current
  // approved: all steps complete (currentStep > 3)
  const currentStep = disposalRequest
    ? disposalRequest.reviewStatus === DRSVal.PENDING
      ? 1
      : disposalRequest.reviewStatus === DRSVal.REVIEWED
        ? 3
        : 4
    : 0;

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
