'use client';

import { useTranslations } from 'next-intl';
import { Wrench, LinkIcon, CalendarCheck } from 'lucide-react';
import { getNCPrerequisite } from '@equipment-management/schemas';
import type { NonConformance } from '@/lib/api/non-conformances-api';
import {
  NC_INFO_CARD_TOKENS,
  NC_REPAIR_LINKED_TOKENS,
  NC_REPAIR_DETAIL_TOKENS,
} from '@/lib/design-tokens';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { getNCMessageKey } from '@/lib/i18n/get-nc-message-key';
import { resolveDisplayName } from '@/lib/utils/display-name';
import { cn } from '@/lib/utils';

export interface InfoCardsProps {
  nc: NonConformance;
  onRepairRegister: () => void;
  onCalibrationRegister: () => void;
  onCalibrationView: () => void;
}

export function InfoCards({
  nc,
  onRepairRegister,
  onCalibrationRegister,
  onCalibrationView,
}: InfoCardsProps) {
  const { fmtDate } = useDateFormatter();
  const t = useTranslations('non-conformances');
  const hasRepairLink = !!nc.repairHistoryId;
  const hasCalibrationLink = !!nc.calibrationId;
  const prerequisiteType = getNCPrerequisite(nc.ncType);
  const needsRepair = prerequisiteType === 'repair';
  const isCalibrationRelated =
    nc.ncType === 'calibration_failure' || nc.ncType === 'calibration_overdue';

  const gridClass =
    (needsRepair && hasRepairLink) || (isCalibrationRelated && hasCalibrationLink)
      ? NC_INFO_CARD_TOKENS.gridRepairLinked
      : needsRepair || isCalibrationRelated
        ? NC_INFO_CARD_TOKENS.grid
        : 'grid grid-cols-1';

  return (
    <div className={gridClass}>
      {/* 기본 정보 */}
      <div className={NC_INFO_CARD_TOKENS.card}>
        <h3 className={NC_INFO_CARD_TOKENS.cardTitle}>{t('detail.infoCard.basicInfo')}</h3>
        <InfoRow label={t('fields.type')} value={t('ncType.' + nc.ncType)} />
        <InfoRow
          label={t('fields.discoverer')}
          value={resolveDisplayName(nc.discoverer?.name, nc.discoveredBy)}
        />
        <InfoRow label={t('fields.discoveredAt')} value={fmtDate(nc.discoveryDate)} />
        <div className={NC_INFO_CARD_TOKENS.infoRowVertical}>
          <span className={NC_INFO_CARD_TOKENS.infoLabel}>{t('fields.cause')}</span>
          <p className={NC_INFO_CARD_TOKENS.infoValueMultiline}>{nc.cause}</p>
        </div>
        {nc.actionPlan && (
          <div className={NC_INFO_CARD_TOKENS.infoRowVertical}>
            <span className={NC_INFO_CARD_TOKENS.infoLabel}>{t('fields.actionPlan')}</span>
            <p className={NC_INFO_CARD_TOKENS.infoValueMultiline}>{nc.actionPlan}</p>
          </div>
        )}
      </div>

      {/* 수리 카드 — damage, malfunction */}
      {needsRepair && <RepairCard nc={nc} onRepairRegister={onRepairRegister} />}

      {/* 교정 카드 — calibration_overdue, calibration_failure */}
      {isCalibrationRelated && (
        <CalibrationCard
          nc={nc}
          onCalibrationRegister={onCalibrationRegister}
          onCalibrationView={onCalibrationView}
        />
      )}
    </div>
  );
}

function RepairCard({
  nc,
  onRepairRegister,
}: {
  nc: NonConformance;
  onRepairRegister: () => void;
}) {
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

function CalibrationCard({
  nc,
  onCalibrationRegister,
  onCalibrationView,
}: {
  nc: NonConformance;
  onCalibrationRegister: () => void;
  onCalibrationView: () => void;
}) {
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={NC_INFO_CARD_TOKENS.infoRow}>
      <span className={NC_INFO_CARD_TOKENS.infoLabel}>{label}</span>
      <span className={NC_INFO_CARD_TOKENS.infoValue}>{value}</span>
    </div>
  );
}
