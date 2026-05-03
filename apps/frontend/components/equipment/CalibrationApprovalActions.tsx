'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';
import RejectModal from '@/components/approvals/RejectModal';
import { queryKeys } from '@/lib/api/query-config';
import { CalibrationCacheInvalidation } from '@/lib/api/cache-invalidation';
import calibrationApi, { type Calibration } from '@/lib/api/calibration-api';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ui/use-toast';
import { mapCalibrationErrorToToast } from '@/lib/errors/calibration-errors';
import { CalibrationApprovalStatusValues as CASVal } from '@equipment-management/schemas';
import { Permission, VALIDATION_RULES } from '@equipment-management/shared-constants';
import { getCalibrationActionButtonClasses } from '@/lib/design-tokens';

interface CalibrationApprovalActionsProps {
  calibration: Calibration;
  equipmentId: string;
}

/**
 * 교정 승인/반려 인라인 액션
 *
 * 렌더링 조건: approvalStatus === 'pending_approval' AND can(APPROVE_CALIBRATION)
 * CAS: version 필드 전달 필수 (동시 수정 충돌 방지)
 */
export function CalibrationApprovalActions({
  calibration,
  equipmentId,
}: CalibrationApprovalActionsProps) {
  const t = useTranslations('equipment');
  const { can } = useAuth();
  const { toast } = useToast();
  const canApprove = can(Permission.APPROVE_CALIBRATION);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // 훅은 조건부 return 이전에 항상 호출 (React 훅 규칙)
  const approveMutation = useOptimisticMutation<
    Calibration,
    { id: string; version: number },
    Calibration[]
  >({
    mutationFn: ({ id, version }) => calibrationApi.approveCalibration(id, { version }),
    queryKey: queryKeys.calibrations.byEquipment(equipmentId),
    optimisticUpdate: (old, { id }) =>
      (old ?? []).map((cal) => (cal.id === id ? { ...cal, approvalStatus: CASVal.APPROVED } : cal)),
    invalidateKeys: [...CalibrationCacheInvalidation.APPROVE_KEYS],
    successMessage: t('calibrationHistoryTab.approval.approveSuccess'),
  });

  const rejectMutation = useOptimisticMutation<
    Calibration,
    { id: string; version: number; rejectionReason: string },
    Calibration[]
  >({
    mutationFn: ({ id, version, rejectionReason }) =>
      calibrationApi.rejectCalibration(id, { version, rejectionReason }),
    queryKey: queryKeys.calibrations.byEquipment(equipmentId),
    optimisticUpdate: (old, { id }) =>
      (old ?? []).map((cal) => (cal.id === id ? { ...cal, approvalStatus: CASVal.REJECTED } : cal)),
    invalidateKeys: [...CalibrationCacheInvalidation.REJECT_KEYS],
    successMessage: t('calibrationHistoryTab.approval.rejectSuccess'),
    onErrorCallback: (error: unknown) => {
      const { title, description } = mapCalibrationErrorToToast(error, t);
      toast({ title, description, variant: 'destructive' });
    },
  });

  // 렌더링 조건: pending_approval 상태 + 승인 권한 보유
  if (calibration.approvalStatus !== CASVal.PENDING_APPROVAL || !canApprove) {
    return null;
  }

  const isPending = approveMutation.isPending || rejectMutation.isPending;

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          className={getCalibrationActionButtonClasses('approve')}
          aria-label={t('calibrationHistoryTab.approval.approveAriaLabel', {
            date: calibration.calibrationDate ?? calibration.id,
          })}
          disabled={isPending}
          loading={isPending}
          onClick={() =>
            approveMutation.mutate({ id: calibration.id, version: calibration.version })
          }
        >
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
          {t('calibrationHistoryTab.approval.approve')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className={getCalibrationActionButtonClasses('reject')}
          aria-label={t('calibrationHistoryTab.approval.rejectAriaLabel', {
            date: calibration.calibrationDate ?? calibration.id,
          })}
          disabled={isPending}
          loading={isPending}
          onClick={() => setIsRejectDialogOpen(true)}
        >
          <XCircle className="h-3.5 w-3.5 mr-1" />
          {t('calibrationHistoryTab.approval.reject')}
        </Button>
      </div>
      <RejectModal
        mode="domain"
        isOpen={isRejectDialogOpen}
        onClose={() => setIsRejectDialogOpen(false)}
        onConfirm={async (reason: string) => {
          await rejectMutation.mutateAsync({
            id: calibration.id,
            version: calibration.version,
            rejectionReason: reason,
          });
        }}
        title={t('calibrationHistoryTab.approval.reject')}
        description={t('calibrationHistoryTab.approval.rejectDescription', {
          min: VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH,
        })}
      />
    </>
  );
}
