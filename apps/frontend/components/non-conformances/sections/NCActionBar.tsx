'use client';

import { useTranslations } from 'next-intl';
import { Check, X } from 'lucide-react';
import { NonConformanceStatusValues as NCVal } from '@equipment-management/schemas';
import type { NonConformance } from '@/lib/api/non-conformances-api';
import { Button } from '@/components/ui/button';
import { NC_ACTION_BAR_TOKENS, NC_APPROVE_BUTTON_TOKENS } from '@/lib/design-tokens';

export interface ActionBarProps {
  nc: NonConformance;
  canCloseNC: boolean;
  hasUnmetPrerequisite: boolean;
  prerequisiteMessage?: string;
  onMarkCorrected: () => void;
  onClose: () => void;
  onReject: () => void;
  isUpdating: boolean;
}

export function ActionBar({
  nc,
  canCloseNC,
  hasUnmetPrerequisite,
  prerequisiteMessage,
  onMarkCorrected,
  onClose,
  onReject,
  isUpdating,
}: ActionBarProps) {
  const t = useTranslations('non-conformances');
  return (
    <div className={NC_ACTION_BAR_TOKENS.container}>
      <div className={NC_ACTION_BAR_TOKENS.left}>
        {/* 시험실무자 액션 */}
        {nc.status === NCVal.OPEN && (
          <Button
            size="sm"
            onClick={onMarkCorrected}
            disabled={isUpdating || hasUnmetPrerequisite || !nc.correctionContent?.trim()}
            title={
              hasUnmetPrerequisite
                ? prerequisiteMessage
                : !nc.correctionContent?.trim()
                  ? t('detail.actionBar.hintNeedsContent')
                  : undefined
            }
          >
            {t('detail.actionBar.markCorrected')}
          </Button>
        )}
      </div>
      <div className={NC_ACTION_BAR_TOKENS.right}>
        {/* 기술책임자 액션 (corrected 상태만) */}
        {canCloseNC && nc.status === NCVal.CORRECTED && (
          <>
            <Button variant="outline" size="sm" onClick={onReject} disabled={isUpdating}>
              <X className="h-3.5 w-3.5 mr-1" />
              {t('detail.actionBar.reject')}
            </Button>
            <Button
              size="sm"
              className={NC_APPROVE_BUTTON_TOKENS.approve}
              onClick={onClose}
              disabled={isUpdating || hasUnmetPrerequisite}
              title={hasUnmetPrerequisite ? prerequisiteMessage : undefined}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              {t('detail.actionBar.closureApprove')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
