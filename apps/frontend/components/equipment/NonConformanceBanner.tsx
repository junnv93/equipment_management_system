'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

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
    <Alert variant="destructive" className="border-ul-red bg-red-50 dark:bg-red-950/30">
      <AlertTriangle className="h-5 w-5 text-ul-red" />
      <AlertTitle className="text-ul-red font-semibold text-lg">
        {t('title', { count: nonConformances.length })}
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-red-800 dark:text-red-200">{t('description')}</p>
        {showDetails && (
          <div className="space-y-2">
            {nonConformances.map((nc) => (
              <div key={nc.id} className="bg-card p-3 rounded-lg border border-brand-critical/20">
                <p className="text-sm text-gray-900 dark:text-gray-100">{nc.cause}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('discoveryDate', { date: new Date(nc.discoveryDate).toLocaleDateString() })}
                </p>
              </div>
            ))}
          </div>
        )}
        <Link href={`/equipment/${equipmentId}/non-conformance`}>
          <Button variant="default" size="sm" className="mt-2">
            {t('manage')}
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
}
