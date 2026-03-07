'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { OverdueCheckout } from '@/lib/api/dashboard-api';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';

interface OverdueCheckoutsCardProps {
  overdueCheckouts: OverdueCheckout[];
  loading?: boolean;
}

export function OverdueCheckoutsCard({
  overdueCheckouts,
  loading = false,
}: OverdueCheckoutsCardProps) {
  const t = useTranslations('dashboard.overdueCheckouts');

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-12" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="bg-card border border-border rounded-lg p-4 flex flex-col gap-2"
      role="region"
      aria-label={t('ariaLabel')}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{t('title')}</h2>
        {overdueCheckouts.length > 0 && (
          <span className="text-xs font-medium text-ul-red dark:text-red-400">
            {t('count', { count: overdueCheckouts.length })}
          </span>
        )}
      </div>

      {/* 리스트 */}
      {overdueCheckouts.length > 0 ? (
        <div className="flex flex-col gap-1 overflow-y-auto max-h-[200px]">
          {overdueCheckouts.slice(0, 6).map((item) => (
            <Link
              key={item.id}
              href={FRONTEND_ROUTES.CHECKOUTS.DETAIL(item.id)}
              className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 group"
              aria-label={`${item.equipment?.name ?? ''} ${t('daysOverdue', { days: item.daysOverdue })}`}
            >
              {/* D+N 배지 */}
              <span className="font-mono tabular-nums font-bold text-xs text-ul-red dark:text-red-400 w-12 flex-shrink-0">
                {t('daysOverdue', { days: item.daysOverdue })}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-foreground truncate">{item.equipment?.name ?? ''}</div>
                {item.user?.name && (
                  <div className="text-[10px] text-muted-foreground truncate">{item.user.name}</div>
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] text-muted-foreground group-hover:text-foreground flex-shrink-0'
                )}
              >
                →
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
          <CheckCircle2 className="h-8 w-8 mb-1 text-ul-green" aria-hidden="true" />
          <p className="text-xs font-medium">{t('empty')}</p>
        </div>
      )}
    </div>
  );
}
