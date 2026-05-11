'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VALIDATION_INFO_CARD_TOKENS as TOK } from '@/lib/design-tokens';
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
        <dl className={TOK.dl}>
          <div className="sm:col-span-2">
            <dt className={TOK.dt}>{t('validation.detail.referenceDocuments')}</dt>
            <dd className={`${TOK.dd} whitespace-pre-wrap`}>
              {validation.referenceDocuments || '-'}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className={TOK.dt}>{t('validation.detail.operatingUnitDescription')}</dt>
            <dd className={`${TOK.dd} whitespace-pre-wrap`}>
              {validation.operatingUnitDescription || '-'}
            </dd>
          </div>
          <div>
            <dt className={TOK.dt}>{t('validation.detail.softwareComponents')}</dt>
            <dd className={`${TOK.dd} whitespace-pre-wrap`}>
              {validation.softwareComponents || '-'}
            </dd>
          </div>
          <div>
            <dt className={TOK.dt}>{t('validation.detail.hardwareComponents')}</dt>
            <dd className={`${TOK.dd} whitespace-pre-wrap`}>
              {validation.hardwareComponents || '-'}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
