'use client';

import * as React from 'react';
import { QrCode } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CheckoutStatusValues as CSVal, type CheckoutStatus } from '@equipment-management/schemas';
import { Button } from '@/components/ui/button';
import { HandoverQRDisplay } from './HandoverQRDisplay';

interface HandoverActionButtonProps {
  checkoutId: string;
  status: CheckoutStatus;
  currentUserId: string;
  requesterId: string;
  approverId?: string | null;
}

/**
 * 인수인계 QR 발급 버튼.
 *
 * 가시성 룰 (SSOT: UL-QP-18 § 인수인계 프로세스):
 * - status ∈ {lender_checked, checked_out, borrower_returned}
 * - currentUserId ∈ {requesterId, approverId}
 *
 * purpose 결정은 백엔드(checkouts.controller issueHandoverToken → PURPOSE_BY_STATUS) 전담.
 * 프론트는 PURPOSE_BY_STATUS를 mirror하지 않음.
 */
export function HandoverActionButton({
  checkoutId,
  status,
  currentUserId,
  requesterId,
  approverId,
}: HandoverActionButtonProps) {
  const t = useTranslations('checkouts.handoverQR');
  const [open, setOpen] = React.useState(false);

  const HANDOVER_STATUSES: CheckoutStatus[] = [
    CSVal.LENDER_CHECKED as CheckoutStatus,
    CSVal.CHECKED_OUT as CheckoutStatus,
    CSVal.BORROWER_RETURNED as CheckoutStatus,
  ];

  const isParticipant = currentUserId === requesterId || currentUserId === approverId;
  const isHandoverStatus = HANDOVER_STATUSES.includes(status);

  if (!isHandoverStatus || !isParticipant) return null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="min-h-[var(--touch-target-min)] gap-1.5"
      >
        <QrCode className="h-4 w-4" aria-hidden="true" />
        {t('purposeTitle')}
      </Button>

      <HandoverQRDisplay checkoutId={checkoutId} open={open} onOpenChange={setOpen} />
    </>
  );
}
