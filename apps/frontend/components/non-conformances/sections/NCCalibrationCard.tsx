'use client';

import { useTranslations } from 'next-intl';
import { CalendarCheck } from 'lucide-react';
import type { NonConformance } from '@/lib/api/non-conformances-api';
import { NC_INFO_CARD_TOKENS, NC_REPAIR_LINKED_TOKENS } from '@/lib/design-tokens';
import { getNCMessageKey } from '@/lib/i18n/get-nc-message-key';
import { cn } from '@/lib/utils';

export interface NCCalibrationCardProps {
  nc: NonConformance;
  onCalibrationRegister: () => void;
  onCalibrationView: () => void;
}

export function NCCalibrationCard({
  nc,
  onCalibrationRegister,
  onCalibrationView,
}: NCCalibrationCardProps) {
  const t = useTranslations('non-conformances');
  const hasCalibrationLink = !!nc.calibrationId;
  const isBlocking = nc.ncType === 'calibration_overdue';

  const cardClass = hasCalibrationLink
    ? NC_INFO_CARD_TOKENS.repairLinkedCard
    : isBlocking
      ? NC_INFO_CARD_TOKENS.repairNeededCard
      : '';

  const titleClass = hasCalibrationLink
    ? NC_INFO_CARD_TOKENS.repairLinkedTitle
    : isBlocking
      ? NC_INFO_CARD_TOKENS.repairNeededTitle
      : '';

  const title = hasCalibrationLink
    ? t('detail.infoCard.calibrationCard.overdueLinkedTitle')
    : isBlocking
      ? t('detail.infoCard.calibrationCard.overdueTitle')
      : t('detail.infoCard.calibrationCard.failureTitle');

  const typeLabel = t(getNCMessageKey(`ncType.${nc.ncType}`));

  return (
    <div className={cn(NC_INFO_CARD_TOKENS.card, cardClass)}>
      <h3 className={cn(NC_INFO_CARD_TOKENS.cardTitle, titleClass)}>{title}</h3>
      {hasCalibrationLink ? (
        <div className="flex items-center gap-2 py-2 flex-wrap">
          <CalendarCheck className="h-4 w-4 text-brand-ok" aria-hidden="true" />
          <span className={NC_REPAIR_LINKED_TOKENS.badge}>
            {t('detail.infoCard.calibrationCard.linkedBadge')}
          </span>
          <button
            type="button"
            className={cn(NC_INFO_CARD_TOKENS.registerLink, 'ml-auto')}
            onClick={onCalibrationView}
          >
            {t('detail.infoCard.calibrationCard.viewLink')}
          </button>
        </div>
      ) : (
        <div className="space-y-2 py-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t(
              isBlocking
                ? 'detail.infoCard.calibrationCard.overdueDescription'
                : 'detail.infoCard.calibrationCard.failureDescription',
              { type: typeLabel }
            )}
          </p>
          <button
            type="button"
            className={NC_INFO_CARD_TOKENS.registerLink}
            onClick={onCalibrationRegister}
          >
            <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {t('detail.infoCard.calibrationCard.registerLink')}
          </button>
        </div>
      )}
    </div>
  );
}
