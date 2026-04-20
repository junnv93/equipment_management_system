'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import type { SoftwareValidation } from '@/lib/api/software-api';

interface ValidationVendorInfoCardProps {
  validation: SoftwareValidation;
}

export function ValidationVendorInfoCard({ validation }: ValidationVendorInfoCardProps) {
  const t = useTranslations('software');
  const { fmtDate } = useDateFormatter();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('validation.detail.vendorInfo')}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">{t('validation.detail.vendorName')}</dt>
            <dd className="text-sm font-medium">{validation.vendorName || '-'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-muted-foreground">
              {t('validation.detail.vendorSummary')}
            </dt>
            <dd className="text-sm whitespace-pre-wrap">{validation.vendorSummary || '-'}</dd>
          </div>
          {validation.receivedBy && (
            <div>
              <dt className="text-sm text-muted-foreground">{t('validation.detail.receivedBy')}</dt>
              <dd className="text-sm">{validation.receivedBy}</dd>
            </div>
          )}
          {validation.receivedDate && (
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('validation.detail.receivedDate')}
              </dt>
              <dd className="text-sm">{fmtDate(validation.receivedDate)}</dd>
            </div>
          )}
          {validation.attachmentNote && (
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted-foreground">
                {t('validation.detail.attachmentNote')}
              </dt>
              <dd className="text-sm whitespace-pre-wrap">{validation.attachmentNote}</dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
