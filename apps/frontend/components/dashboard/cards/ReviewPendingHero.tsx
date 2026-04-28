/**
 * ReviewPendingHero — 품질책임자 검토 대기 가로형 hero 카드 (대시보드 개선안 §4.3)
 *
 * 명세 §3.3 (보강): 큰 숫자 + CTA + 평균 대기/이번 주 처리/처리율(7d).
 * 표시 데이터는 후속 백엔드 API(`GET /api/dashboard/quality/review-pending`)에서 제공되며,
 * 누락 시 안전 fallback (0).
 */

'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ClipboardCheck, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { REVIEW_PROCESSING_RATE_THRESHOLDS } from '@equipment-management/shared-constants';

interface ReviewPendingHeroProps {
  pendingCount: number;
  avgWaitDays?: number;
  maxWaitDays?: number;
  thisWeekProcessed?: number;
  /** 처리율 % (0-100). 임계값 SSOT: REVIEW_PROCESSING_RATE_THRESHOLDS. */
  processingRate?: number;
  href: string;
  loading?: boolean;
  className?: string;
}

/** 처리율 → 색상 클래스. 임계값은 SSOT (shared-constants). */
function processingRateTone(rate: number): string {
  if (rate >= REVIEW_PROCESSING_RATE_THRESHOLDS.green) return 'text-brand-success';
  if (rate >= REVIEW_PROCESSING_RATE_THRESHOLDS.amber) return 'text-brand-warning';
  return 'text-brand-critical';
}

export function ReviewPendingHero({
  pendingCount,
  avgWaitDays,
  maxWaitDays,
  thisWeekProcessed,
  processingRate,
  href,
  loading = false,
  className,
}: ReviewPendingHeroProps) {
  const t = useTranslations('dashboard.reviewPendingHero');
  if (loading) {
    return (
      <Card className={cn('p-5 ring-1 ring-brand-info/20', className)}>
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn('p-5 ring-1 ring-brand-info/20 shadow-sm', className)}
      role="region"
      aria-label={t('title')}
    >
      <header className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight">{t('title')}</h3>
          <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
        </div>
      </header>

      <div className="flex items-center gap-4">
        <div
          className="grid place-items-center w-14 h-14 rounded-xl bg-brand-purple/10 text-brand-purple shrink-0"
          aria-hidden="true"
        >
          <ClipboardCheck className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground mb-0.5">{t('iconLabel')}</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-bold tracking-tight tabular-nums">{pendingCount}</span>
            <span className="text-sm text-muted-foreground">{t('pendingCountSuffix')}</span>
          </div>
          {(avgWaitDays != null || maxWaitDays != null) && (
            <div className="text-xs text-muted-foreground mt-1.5">
              {avgWaitDays != null && <>{t('avgWaitDays', { days: avgWaitDays })}</>}
              {avgWaitDays != null && maxWaitDays != null && ' · '}
              {maxWaitDays != null && <>{t('maxWaitDays', { days: maxWaitDays })}</>}
            </div>
          )}
        </div>
        <Link href={href}>
          <Button size="sm" className="gap-1.5">
            {t('ctaStart')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </Link>
      </div>

      {(thisWeekProcessed != null || processingRate != null) && (
        <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 gap-3">
          {thisWeekProcessed != null && (
            <div className="text-xs">
              <div className="text-muted-foreground">{t('thisWeekProcessed')}</div>
              <div className="text-lg font-bold tabular-nums">{thisWeekProcessed}</div>
            </div>
          )}
          {processingRate != null && (
            <div className="text-xs">
              <div className="text-muted-foreground">{t('processingRate')}</div>
              <div
                className={cn('text-lg font-bold tabular-nums', processingRateTone(processingRate))}
              >
                {processingRate}%
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
