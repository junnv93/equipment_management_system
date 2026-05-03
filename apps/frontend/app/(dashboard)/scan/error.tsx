'use client';

import { useTranslations } from 'next-intl';
import { RouteError } from '@/components/layout/RouteError';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ScanRouteErrorPage({ error, reset }: ErrorPageProps) {
  const t = useTranslations('common');

  return (
    <RouteError
      error={error}
      reset={reset}
      title={t('errors.scanErrorTitle')}
      description={t('errors.scanErrorDescription')}
    />
  );
}
