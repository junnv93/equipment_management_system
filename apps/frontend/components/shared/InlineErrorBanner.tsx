'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineErrorBannerProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/**
 * 인라인 에러 배너 — 섹션 독립 에러 표시 (전체 페이지 에러와 구분)
 *
 * 사용처: HeroKPIError, NextStepPanelError, WorkflowTimelineError
 * retryLabel을 함께 전달해야 재시도 버튼이 표시됨.
 */
export function InlineErrorBanner({
  message,
  onRetry,
  retryLabel,
  className,
}: InlineErrorBannerProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive',
        className
      )}
    >
      <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span className="flex-1">{message}</span>
      {onRetry && retryLabel && (
        <button
          type="button"
          onClick={onRetry}
          className="ml-2 inline-flex items-center gap-1 text-xs font-medium underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
