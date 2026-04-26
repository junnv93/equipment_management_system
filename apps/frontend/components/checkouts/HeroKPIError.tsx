'use client';

import { useTranslations } from 'next-intl';
import { InlineErrorBanner } from '@/components/shared/InlineErrorBanner';

interface HeroKPIErrorProps {
  onRetry?: () => void;
}

export function HeroKPIError({ onRetry }: HeroKPIErrorProps) {
  const t = useTranslations('checkouts.error');
  return (
    <InlineErrorBanner
      message={t('heroKpi')}
      onRetry={onRetry}
      retryLabel={t('retry')}
      className="mb-5"
    />
  );
}
