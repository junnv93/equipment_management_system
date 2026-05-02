'use client';

import { useTranslations } from 'next-intl';
import RejectModal from '@/components/approvals/RejectModal';

interface ValidationRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onConfirm: (reason: string) => void;
}

/**
 * ValidationRejectDialog — RejectModal SSOT thin wrapper
 *
 * 5-layer defense-in-depth: backend가 ≥10자 강제 (Zod + service fail-close + ErrorCode).
 * RejectModal 내부 RejectReasonSchema가 동일 룰 적용 → frontend 사전 검증 일관.
 *
 * @deprecated 호출자 직접 RejectModal 사용 권장 — 본 wrapper는 호환성 유지용
 */
export function ValidationRejectDialog({
  open,
  onOpenChange,
  isPending,
  onConfirm,
}: ValidationRejectDialogProps) {
  const t = useTranslations('software');

  // RejectModal은 자체 mutation 호출 패턴(`onConfirm: (reason) => Promise<void>`)을 사용한다.
  // 본 wrapper는 호출자의 isPending 상태와 호환을 위해 sync onConfirm signature로 노출.
  return (
    <RejectModal
      mode="domain"
      isOpen={open}
      onClose={() => onOpenChange(false)}
      onConfirm={async (reason: string) => {
        onConfirm(reason);
      }}
      title={t('validation.rejectDialog.title')}
      description={t('validation.rejectDialog.reasonHint')}
      submitLabel={
        isPending ? t('validation.rejectDialog.submitting') : t('validation.rejectDialog.confirm')
      }
    />
  );
}
