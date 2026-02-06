'use client';

import { Button } from '@/components/ui/button';
import { Trash2, CheckCircle2 } from 'lucide-react';
import type { Equipment } from '@/lib/api/equipment-api';
import type { DisposalRequest } from '@equipment-management/schemas';
import { DisposalDropdownMenu } from './DisposalDropdownMenu';

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
  // Disposed state - disabled button
  if (equipment.status === 'disposed') {
    return (
      <Button variant="outline" disabled className="border-gray-300 text-gray-500">
        <CheckCircle2 className="mr-2 h-4 w-4" />
        폐기 완료
      </Button>
    );
  }

  // Pending disposal - dropdown menu
  if (equipment.status === 'pending_disposal' && disposalRequest) {
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
  if (equipment.status === 'available' && permissions.canRequestDisposal) {
    return (
      <Button
        variant="outline"
        onClick={onRequestOpen}
        className="border-red-500 text-red-600 hover:bg-red-50"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        폐기 요청
      </Button>
    );
  }

  return null;
}
