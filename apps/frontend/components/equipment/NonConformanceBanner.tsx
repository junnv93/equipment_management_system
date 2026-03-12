'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { NC_BANNER_TOKENS } from '@/lib/design-tokens';

interface NonConformance {
  id: string;
  status: string;
  cause: string;
  discoveryDate: string | Date;
}

interface NonConformanceBannerProps {
  equipmentId: string;
  nonConformances: NonConformance[];
  showDetails?: boolean;
}

export function NonConformanceBanner({
  equipmentId,
  nonConformances,
  showDetails = false,
}: NonConformanceBannerProps) {
  const t = useTranslations('equipment.nonConformanceBanner');

  if (!nonConformances || nonConformances.length === 0) {
    return null;
  }

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
