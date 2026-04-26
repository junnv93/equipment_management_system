'use client';

import { useTranslations } from 'next-intl';
import { InlineErrorBanner } from '@/components/shared/InlineErrorBanner';

interface NextStepPanelErrorProps {
  onRetry?: () => void;
}

export function NextStepPanelError({ onRetry }: NextStepPanelErrorProps) {
  const t = useTranslations('checkouts.error');
  return (
    <InlineErrorBanner message={t('nextStepPanel')} onRetry={onRetry} retryLabel={t('retry')} />
  );
}
