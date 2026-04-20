'use client';

import { useTranslations } from 'next-intl';
import { FileCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import type { SoftwareValidation } from '@/lib/api/software-api';

interface ValidationBasicInfoCardProps {
  validation: SoftwareValidation;
}

export function ValidationBasicInfoCard({ validation }: ValidationBasicInfoCardProps) {
  const t = useTranslations('software');
  const { fmtDate } = useDateFormatter();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileCheck className="h-5 w-5 text-brand-info" aria-hidden="true" />
          {t('validation.detail.basicInfo')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">
              {t('validation.detail.validationType')}
            </dt>
            <dd className="text-sm font-medium">
              {t(`validationType.${validation.validationType}`)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">
              {t('validation.detail.softwareVersion')}
            </dt>
            <dd className="text-sm font-mono">{validation.softwareVersion || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">{t('validation.detail.testDate')}</dt>
            <dd className="text-sm">{validation.testDate ? fmtDate(validation.testDate) : '-'}</dd>
          </div>
          {validation.infoDate && (
            <div>
              <dt className="text-sm text-muted-foreground">{t('validation.detail.infoDate')}</dt>
              <dd className="text-sm">{fmtDate(validation.infoDate)}</dd>
            </div>
          )}
          {validation.softwareAuthor && (
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('validation.detail.softwareAuthor')}
              </dt>
              <dd className="text-sm">{validation.softwareAuthor}</dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
