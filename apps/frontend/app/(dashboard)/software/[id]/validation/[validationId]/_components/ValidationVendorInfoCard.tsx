'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VALIDATION_INFO_CARD_TOKENS as TOK } from '@/lib/design-tokens';
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
        <dl className={TOK.dl}>
          <div>
            <dt className={TOK.dt}>{t('validation.detail.vendorName')}</dt>
            <dd className={TOK.dd}>{validation.vendorName || '-'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className={TOK.dt}>{t('validation.detail.vendorSummary')}</dt>
            <dd className={`${TOK.dd} whitespace-pre-wrap`}>{validation.vendorSummary || '-'}</dd>
          </div>
          {validation.receivedBy && (
            <div>
              <dt className={TOK.dt}>{t('validation.detail.receivedBy')}</dt>
              <dd className={TOK.dd}>{validation.receivedBy}</dd>
            </div>
          )}
          {validation.receivedDate && (
            <div>
              <dt className={TOK.dt}>{t('validation.detail.receivedDate')}</dt>
              <dd className={TOK.dd}>{fmtDate(validation.receivedDate)}</dd>
            </div>
          )}
          {validation.attachmentNote && (
            <div className="sm:col-span-2">
              <dt className={TOK.dt}>{t('validation.detail.attachmentNote')}</dt>
              <dd className={`${TOK.dd} whitespace-pre-wrap`}>{validation.attachmentNote}</dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
