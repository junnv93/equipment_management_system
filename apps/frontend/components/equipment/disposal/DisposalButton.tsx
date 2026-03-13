'use client';

import { Button } from '@/components/ui/button';
import { Trash2, CheckCircle2 } from 'lucide-react';
import type { Equipment } from '@/lib/api/equipment-api';
import {
  EquipmentStatusValues as ESVal,
  type DisposalRequest,
} from '@equipment-management/schemas';
import { DisposalDropdownMenu } from './DisposalDropdownMenu';
import { DISPOSAL_BUTTON_TOKENS } from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';

interface DisposalButtonProps {
  equipment: Equipment;
  disposalRequest: DisposalRequest | null;
  onRequestOpen: () => void;
  onReviewOpen: () => void;
  onApproveOpen: () => void;
  onCancelOpen: () => void;
  onDetailOpen: () => void;
  permissions: {
    canRequestDisposal: boolean;
    canReviewDisposal: boolean;
    canApproveDisposal: boolean;
    canCancelDisposal: boolean;
    isReadOnly: boolean;
    currentStep: number;
  };
}

export function DisposalButton({
  equipment,
  disposalRequest,
  onRequestOpen,
  onReviewOpen,
  onApproveOpen,
  onCancelOpen,
  onDetailOpen,
  permissions,
}: DisposalButtonProps) {
  const t = useTranslations('disposal');

  // Disposed state - disabled button
  if (equipment.status === ESVal.DISPOSED) {
    return (
      <Button variant="outline" disabled className={DISPOSAL_BUTTON_TOKENS.completed}>
        <CheckCircle2 className="mr-2 h-4 w-4" />
        {t('button.completed')}
      </Button>
    );
  }

  // Pending disposal - dropdown menu
  if (equipment.status === ESVal.PENDING_DISPOSAL && disposalRequest) {
    return (
      <DisposalDropdownMenu
        disposalRequest={disposalRequest}
        permissions={permissions}
        onReviewOpen={onReviewOpen}
        onApproveOpen={onApproveOpen}
        onCancelOpen={onCancelOpen}
        onDetailOpen={onDetailOpen}
      />
    );
  }

  // Available - request button
  if (equipment.status === ESVal.AVAILABLE && permissions.canRequestDisposal) {
    return (
      <Button variant="outline" onClick={onRequestOpen} className={DISPOSAL_BUTTON_TOKENS.request}>
        <Trash2 className="mr-2 h-4 w-4" />
        {t('button.request')}
      </Button>
    );
  }

  return null;
}
