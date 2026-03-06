import { useAuth } from '@/hooks/use-auth';
import type { Equipment } from '@/lib/api/equipment-api';
import type { DisposalRequest } from '@equipment-management/schemas';

export function useDisposalPermissions(
  equipment: Equipment,
  disposalRequest?: DisposalRequest | null
) {
  const { user, hasRole, isAdmin } = useAuth();

  const canRequestDisposal =
    hasRole(['test_engineer', 'technical_manager', 'lab_manager', 'system_admin']) &&
    equipment.status === 'available' &&
    !equipment.isShared;

  const canReviewDisposal =
    hasRole(['technical_manager']) &&
    equipment.status === 'pending_disposal' &&
    disposalRequest?.reviewStatus === 'pending' &&
    user?.teamId === equipment.teamId;

  const canApproveDisposal =
    isAdmin() &&
    equipment.status === 'pending_disposal' &&
    disposalRequest?.reviewStatus === 'reviewed';

  const canCancelDisposal =
    disposalRequest?.requestedBy === user?.id && disposalRequest?.reviewStatus === 'pending';

  const isReadOnly = equipment.status === 'disposed';

  const showDisposalButton =
    equipment.status !== 'temporary' &&
    (equipment.status === 'available' ||
      equipment.status === 'pending_disposal' ||
      equipment.status === 'disposed');

  // Calculate current step for progress stepper
  // pending: step 1 (요청) is current
  // reviewed: steps 1-2 complete, step 3 (승인) is current
  // approved: all steps complete (currentStep > 3)
  const currentStep = disposalRequest
    ? disposalRequest.reviewStatus === 'pending'
      ? 1
      : disposalRequest.reviewStatus === 'reviewed'
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
