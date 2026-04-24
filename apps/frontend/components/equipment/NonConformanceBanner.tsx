'use client';

import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { NC_BANNER_TOKENS } from '@/lib/design-tokens';
import type { NonConformanceStatus } from '@equipment-management/schemas';

interface NonConformance {
  id: string;
  status: NonConformanceStatus;
  cause: string;
  discoveryDate: string | Date;
}

interface NonConformanceBannerProps {
  equipmentId: string;
  nonConformances: NonConformance[];
  variant?: 'full' | 'compact';
  showDetails?: boolean;
}

function daysSince(date: string | Date): number {
  const ms = Date.now() - new Date(date).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

function CompactBanner({ nonConformances }: { nonConformances: NonConformance[] }) {
  const t = useTranslations('non-conformances');
  const longestOverdueDays = useMemo(
    () => Math.max(0, ...nonConformances.map((nc) => daysSince(nc.discoveryDate))),
    [nonConformances]
  );

  return (
    <Alert variant="destructive" className={NC_BANNER_TOKENS.alertCompact}>
      <AlertTriangle className={NC_BANNER_TOKENS.iconCompact} aria-hidden="true" />
      <div className="text-sm flex-1">
        <strong className={NC_BANNER_TOKENS.titleCompact}>
          {t('banner.compactTitle', { count: nonConformances.length })}
        </strong>
        {longestOverdueDays > 0 && (
          <span className={NC_BANNER_TOKENS.compactOverdue}>
            · {t('banner.compactOverdue', { days: longestOverdueDays })}
          </span>
        )}
      </div>
      <Link href="#non-conformances" className={NC_BANNER_TOKENS.compactCta}>
        {t('banner.compactCta')} →
      </Link>
    </Alert>
  );
}

function FullBanner({
  equipmentId,
  nonConformances,
  showDetails,
}: {
  equipmentId: string;
  nonConformances: NonConformance[];
  showDetails: boolean;
}) {
  const t = useTranslations('equipment.nonConformanceBanner');

  return (
    <Alert variant="destructive" className={NC_BANNER_TOKENS.alert}>
      <AlertTriangle className={NC_BANNER_TOKENS.icon} />
      <AlertTitle className={NC_BANNER_TOKENS.title}>
        {t('title', { count: nonConformances.length })}
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p className={NC_BANNER_TOKENS.desc}>{t('description')}</p>
        {showDetails && (
          <div className="space-y-2">
            {nonConformances.map((nc) => (
              <Link key={nc.id} href={`/non-conformances/${nc.id}`}>
                <div
                  className={`${NC_BANNER_TOKENS.detailCard} hover:border-brand-critical/40 cursor-pointer`}
                >
                  <p className={NC_BANNER_TOKENS.detailText}>{nc.cause}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('discoveryDate', { date: new Date(nc.discoveryDate).toLocaleDateString() })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 mt-2">
          <Link href={`/non-conformances?equipmentId=${equipmentId}`}>
            <Button variant="default" size="sm">
              {t('manage')}
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  );
}

export function NonConformanceBanner({
  equipmentId,
  nonConformances,
  variant = 'full',
  showDetails = false,
}: NonConformanceBannerProps) {
  if (!nonConformances || nonConformances.length === 0) return null;

  if (variant === 'compact') {
    return <CompactBanner nonConformances={nonConformances} />;
  }

  return (
    <FullBanner
      equipmentId={equipmentId}
      nonConformances={nonConformances}
      showDetails={showDetails}
    />
  );
}
