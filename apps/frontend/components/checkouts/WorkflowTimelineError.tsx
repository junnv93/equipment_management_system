'use client';

import { useTranslations } from 'next-intl';
import { InlineErrorBanner } from '@/components/shared/InlineErrorBanner';

interface WorkflowTimelineErrorProps {
  onRetry?: () => void;
}

export function WorkflowTimelineError({ onRetry }: WorkflowTimelineErrorProps) {
  const t = useTranslations('checkouts.error');
  return (
    <InlineErrorBanner message={t('workflowTimeline')} onRetry={onRetry} retryLabel={t('retry')} />
  );
}
