'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';
import { RejectReasonDialog } from '@/components/admin/RejectReasonDialog';
import { queryKeys } from '@/lib/api/query-config';
import calibrationApi, { type Calibration } from '@/lib/api/calibration-api';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { useAuth } from '@/hooks/use-auth';
import {
  UserRoleValues as URVal,
  CalibrationApprovalStatusValues as CASVal,
} from '@equipment-management/schemas';
import { getCalibrationActionButtonClasses } from '@/lib/design-tokens';

// 승인/반려 후 무효화할 쿼리 키 목록 (equipmentId 의존 없는 공통 키)
// — 모듈 상수로 분리해 렌더링마다 새 배열 생성 방지
const APPROVAL_INVALIDATE_KEYS = [
  queryKeys.calibrations.pending(),
  queryKeys.calibrations.all,
] as const;

interface CalibrationApprovalActionsProps {
  calibration: Calibration;
  equipmentId: string;
}

/**
 * 교정 승인/반려 인라인 액션
 *
 * 렌더링 조건: approvalStatus === 'pending_approval' AND hasRole(['technical_manager', 'lab_manager'])
 * CAS: version 필드 전달 필수 (동시 수정 충돌 방지)
 */
export function CalibrationApprovalActions({
  calibration,
  equipmentId,
}: CalibrationApprovalActionsProps) {
  const t = useTranslations('equipment');
  const { hasRole } = useAuth();
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
    invalidateKeys: [...APPROVAL_INVALIDATE_KEYS],
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
    invalidateKeys: [...APPROVAL_INVALIDATE_KEYS],
    successMessage: t('calibrationHistoryTab.approval.rejectSuccess'),
  });

  // 렌더링 조건: pending_approval 상태 + 승인 권한 보유
  if (
    calibration.approvalStatus !== CASVal.PENDING_APPROVAL ||
    !hasRole([URVal.TECHNICAL_MANAGER, URVal.LAB_MANAGER])
  ) {
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
          disabled={isPending}
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
          disabled={isPending}
          onClick={() => setIsRejectDialogOpen(true)}
        >
          <XCircle className="h-3.5 w-3.5 mr-1" />
          {t('calibrationHistoryTab.approval.reject')}
        </Button>
      </div>
      <RejectReasonDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
        isPending={rejectMutation.isPending}
        onConfirm={(reason) =>
          rejectMutation.mutate({
            id: calibration.id,
            version: calibration.version,
            rejectionReason: reason,
          })
        }
      />
    </>
  );
}
