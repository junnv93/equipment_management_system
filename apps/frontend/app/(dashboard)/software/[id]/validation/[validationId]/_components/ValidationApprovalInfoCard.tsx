'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VALIDATION_INFO_CARD_TOKENS as TOK } from '@/lib/design-tokens';
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
        <dl className={TOK.dl}>
          {validation.submittedAt && (
            <>
              {validation.submitterName && (
                <div>
                  <dt className={TOK.dt}>{t('validation.detail.submittedBy')}</dt>
                  <dd className={TOK.dd}>{validation.submitterName}</dd>
                </div>
              )}
              <div>
                <dt className={TOK.dt}>{t('validation.detail.submittedAt')}</dt>
                <dd className={TOK.dd}>{fmtDateTime(validation.submittedAt)}</dd>
              </div>
            </>
          )}
          {validation.technicalApprovedAt && (
            <>
              {validation.technicalApproverName && (
                <div>
                  <dt className={TOK.dt}>{t('validation.detail.technicalApprover')}</dt>
                  <dd className={TOK.dd}>{validation.technicalApproverName}</dd>
                </div>
              )}
              <div>
                <dt className={TOK.dt}>{t('validation.detail.technicalApprovedAt')}</dt>
                <dd className={TOK.dd}>{fmtDateTime(validation.technicalApprovedAt)}</dd>
              </div>
            </>
          )}
          {validation.qualityApprovedAt && (
            <>
              {validation.qualityApproverName && (
                <div>
                  <dt className={TOK.dt}>{t('validation.detail.qualityApprover')}</dt>
                  <dd className={TOK.dd}>{validation.qualityApproverName}</dd>
                </div>
              )}
              <div>
                <dt className={TOK.dt}>{t('validation.detail.qualityApprovedAt')}</dt>
                <dd className={TOK.dd}>{fmtDateTime(validation.qualityApprovedAt)}</dd>
              </div>
            </>
          )}
          {validation.rejectionReason && (
            <div className="sm:col-span-2">
              <dt className={TOK.dt}>{t('validation.detail.rejectionReason')}</dt>
              <dd className={TOK.ddDestructive}>{validation.rejectionReason}</dd>
            </div>
          )}
          <div>
            <dt className={TOK.dt}>{t('validation.detail.createdAt')}</dt>
            <dd className={TOK.dd}>{fmtDateTime(validation.createdAt)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
