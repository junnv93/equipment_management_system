'use client';

import { useTranslations } from 'next-intl';
import type { NonConformance } from '@/lib/api/non-conformances-api';
import { NC_INFO_CARD_TOKENS } from '@/lib/design-tokens';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { resolveDisplayName } from '@/lib/utils/display-name';

export interface NCBasicInfoCardProps {
  nc: NonConformance;
}

export function NCBasicInfoCard({ nc }: NCBasicInfoCardProps) {
  const { fmtDate } = useDateFormatter();
  const t = useTranslations('non-conformances');

  return (
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
