'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface WorkflowTimelineErrorProps {
  onRetry?: () => void;
}

/**
 * WorkflowTimeline 로딩 에러 — 진행 단계 표시 실패 인라인 에러
 */
export function WorkflowTimelineError({ onRetry }: WorkflowTimelineErrorProps) {
  const t = useTranslations('checkouts.error');

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span className="flex-1">{t('workflowTimeline')}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="ml-2 inline-flex items-center gap-1 text-xs font-medium underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
          {t('retry')}
        </button>
      )}
    </div>
  );
}
