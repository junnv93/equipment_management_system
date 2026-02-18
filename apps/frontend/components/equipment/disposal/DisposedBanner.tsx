'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';
import type { DisposalRequest } from '@equipment-management/schemas';
import { formatDateTime } from '@/lib/utils/date';
import { DISPOSAL_BANNER_TOKENS } from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';

interface DisposedBannerProps {
  disposalRequest: DisposalRequest;
}

export function DisposedBanner({ disposalRequest }: DisposedBannerProps) {
  const t = useTranslations('disposal');
  const tReason = useTranslations('disposal.reason');

  return (
    <Alert className={DISPOSAL_BANNER_TOKENS.container} role="status">
      <CheckCircle2 className={DISPOSAL_BANNER_TOKENS.icon} />
      <AlertTitle className={DISPOSAL_BANNER_TOKENS.title}>{t('banner.title')}</AlertTitle>
      <AlertDescription className={DISPOSAL_BANNER_TOKENS.text}>
        <div className="mt-2 space-y-1">
          <p>
            <span className="font-medium">{t('banner.reason')}</span>{' '}
            {tReason(disposalRequest.reason)}
          </p>
          {disposalRequest.approvedByName && disposalRequest.approvedAt && (
            <p>
              <span className="font-medium">{t('banner.approver')}</span>{' '}
              {disposalRequest.approvedByName} | {formatDateTime(disposalRequest.approvedAt)}
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
