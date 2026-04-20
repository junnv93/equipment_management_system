'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import type { SoftwareValidation } from '@/lib/api/software-api';

interface ValidationApprovalInfoCardProps {
  validation: SoftwareValidation;
}

export function ValidationApprovalInfoCard({ validation }: ValidationApprovalInfoCardProps) {
  const t = useTranslations('software');
  const { fmtDateTime } = useDateFormatter();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('validation.detail.approvalInfo')}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {validation.submittedAt && (
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('validation.detail.submittedAt')}
              </dt>
              <dd className="text-sm">{fmtDateTime(validation.submittedAt)}</dd>
            </div>
          )}
          {validation.technicalApprovedAt && (
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('validation.detail.technicalApprovedAt')}
              </dt>
              <dd className="text-sm">{fmtDateTime(validation.technicalApprovedAt)}</dd>
            </div>
          )}
          {validation.qualityApprovedAt && (
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('validation.detail.qualityApprovedAt')}
              </dt>
              <dd className="text-sm">{fmtDateTime(validation.qualityApprovedAt)}</dd>
            </div>
          )}
          {validation.rejectionReason && (
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted-foreground">
                {t('validation.detail.rejectionReason')}
              </dt>
              <dd className="text-sm text-destructive whitespace-pre-wrap">
                {validation.rejectionReason}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-sm text-muted-foreground">{t('validation.detail.createdAt')}</dt>
            <dd className="text-sm">{fmtDateTime(validation.createdAt)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
