'use client';

import { useTranslations } from 'next-intl';
import { Wrench, LinkIcon } from 'lucide-react';
import type { NonConformance } from '@/lib/api/non-conformances-api';
import {
  NC_INFO_CARD_TOKENS,
  NC_REPAIR_LINKED_TOKENS,
  NC_REPAIR_DETAIL_TOKENS,
} from '@/lib/design-tokens';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { getNCMessageKey } from '@/lib/i18n/get-nc-message-key';
import { cn } from '@/lib/utils';

export interface NCRepairCardProps {
  nc: NonConformance;
  onRepairRegister: () => void;
}

export function NCRepairCard({ nc, onRepairRegister }: NCRepairCardProps) {
  const t = useTranslations('non-conformances');
  const hasRepairLink = !!nc.repairHistoryId;

  return (
    <div
      className={cn(
        NC_INFO_CARD_TOKENS.card,
        hasRepairLink ? NC_INFO_CARD_TOKENS.repairLinkedCard : NC_INFO_CARD_TOKENS.repairNeededCard
      )}
    >
      <h3
        className={cn(
          NC_INFO_CARD_TOKENS.cardTitle,
          hasRepairLink
            ? NC_INFO_CARD_TOKENS.repairLinkedTitle
            : NC_INFO_CARD_TOKENS.repairNeededTitle
        )}
      >
        {hasRepairLink ? t('detail.infoCard.repairLinked') : t('detail.infoCard.repairNeeded')}
      </h3>
      {hasRepairLink ? (
        <RepairDetail nc={nc} />
      ) : (
        <div className="space-y-2 py-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('detail.infoCard.repairNeededDescription', {
              type: t(getNCMessageKey(`ncType.${nc.ncType}`)),
            })}
          </p>
          <button
            type="button"
            className={NC_INFO_CARD_TOKENS.registerLink}
            onClick={onRepairRegister}
          >
            <Wrench className="h-3.5 w-3.5" />
            {t('detail.infoCard.repairRegisterLink')}
          </button>
        </div>
      )}
    </div>
  );
}

function RepairDetail({ nc }: { nc: NonConformance }) {
  const { fmtDate } = useDateFormatter();
  const t = useTranslations('non-conformances');
  const rh = nc.repairHistory;
  if (!rh) {
    return (
      <div className="flex items-center gap-2 py-2">
        <LinkIcon className="h-4 w-4 text-brand-ok" />
        <span className={NC_REPAIR_LINKED_TOKENS.badge}>
          {t('detail.infoCard.repairLinkedBadge')}
        </span>
      </div>
    );
  }

  const resultBadgeClass = rh.repairResult
    ? (NC_REPAIR_DETAIL_TOKENS.repairResultBadge[
        rh.repairResult as keyof typeof NC_REPAIR_DETAIL_TOKENS.repairResultBadge
      ] ?? NC_REPAIR_DETAIL_TOKENS.repairResultBadge.completed)
    : null;

  return (
    <div className="py-2 space-y-1">
      <div className={NC_REPAIR_DETAIL_TOKENS.row}>
        <span className={NC_REPAIR_DETAIL_TOKENS.label}>{t('detail.infoCard.repairDate')}</span>
        <span className={NC_REPAIR_DETAIL_TOKENS.value}>{fmtDate(rh.repairDate)}</span>
      </div>
      {rh.repairResult && resultBadgeClass && (
        <div className={NC_REPAIR_DETAIL_TOKENS.row}>
          <span className={NC_REPAIR_DETAIL_TOKENS.label}>{t('detail.infoCard.repairResult')}</span>
          <span className={resultBadgeClass}>
            {t(getNCMessageKey(`detail.infoCard.repairResults.${rh.repairResult}`))}
          </span>
        </div>
      )}
      <div className="pt-1">
        <span className={cn(NC_REPAIR_DETAIL_TOKENS.label, 'block mb-1')}>
          {t('detail.infoCard.repairDescription')}
        </span>
        <p className="text-sm text-foreground leading-relaxed">{rh.repairDescription}</p>
      </div>
    </div>
  );
}
