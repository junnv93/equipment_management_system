'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SoftwareValidation } from '@/lib/api/software-api';

interface ValidationSelfTestInfoCardProps {
  validation: SoftwareValidation;
}

export function ValidationSelfTestInfoCard({ validation }: ValidationSelfTestInfoCardProps) {
  const t = useTranslations('software');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('validation.detail.selfTestInfo')}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-sm text-muted-foreground">
              {t('validation.detail.referenceDocuments')}
            </dt>
            <dd className="text-sm whitespace-pre-wrap">{validation.referenceDocuments || '-'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-muted-foreground">
              {t('validation.detail.operatingUnitDescription')}
            </dt>
            <dd className="text-sm whitespace-pre-wrap">
              {validation.operatingUnitDescription || '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">
              {t('validation.detail.softwareComponents')}
            </dt>
            <dd className="text-sm whitespace-pre-wrap">{validation.softwareComponents || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">
              {t('validation.detail.hardwareComponents')}
            </dt>
            <dd className="text-sm whitespace-pre-wrap">{validation.hardwareComponents || '-'}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
