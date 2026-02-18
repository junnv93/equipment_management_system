'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, CheckCircle, XCircle, Eye } from 'lucide-react';
import type { DisposalRequest } from '@equipment-management/schemas';
import { DisposalProgressStepper } from './DisposalProgressStepper';
import { DISPOSAL_BUTTON_TOKENS } from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';

interface DisposalDropdownMenuProps {
  disposalRequest: DisposalRequest;
  permissions: {
    canReviewDisposal: boolean;
    canApproveDisposal: boolean;
    canCancelDisposal: boolean;
    currentStep: number;
  };
  onReviewOpen: () => void;
  onApproveOpen: () => void;
  onCancelOpen: () => void;
  onDetailOpen: () => void;
}

export function DisposalDropdownMenu({
  disposalRequest: _disposalRequest,
  permissions,
  onReviewOpen,
  onApproveOpen,
  onCancelOpen,
  onDetailOpen,
}: DisposalDropdownMenuProps) {
  const t = useTranslations('disposal');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={DISPOSAL_BUTTON_TOKENS.inProgress}>
          {t('button.inProgress')}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-4">
          <DisposalProgressStepper currentStep={permissions.currentStep} />
        </div>
        <DropdownMenuSeparator />

        {permissions.canReviewDisposal && (
          <DropdownMenuItem onClick={onReviewOpen}>
            <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
            <span className="font-medium">{t('dropdown.review')}</span>
          </DropdownMenuItem>
        )}

        {permissions.canApproveDisposal && (
          <DropdownMenuItem onClick={onApproveOpen}>
            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
            <span className="font-medium">{t('dropdown.approve')}</span>
          </DropdownMenuItem>
        )}

        {permissions.canCancelDisposal && (
          <DropdownMenuItem onClick={onCancelOpen} className="text-red-600">
            <XCircle className="mr-2 h-4 w-4" />
            <span className="font-medium">{t('dropdown.cancel')}</span>
          </DropdownMenuItem>
        )}

        {(permissions.canReviewDisposal ||
          permissions.canApproveDisposal ||
          permissions.canCancelDisposal) && <DropdownMenuSeparator />}

        <DropdownMenuItem onClick={onDetailOpen}>
          <Eye className="mr-2 h-4 w-4 text-gray-600" />
          {t('dropdown.detail')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
