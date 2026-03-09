'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { OverdueCheckout, UpcomingCheckoutReturn } from '@/lib/api/dashboard-api';
import {
  DASHBOARD_OVERDUE_CHECKOUTS_TOKENS as T,
  DASHBOARD_EMPTY_STATE_TOKENS as ES,
} from '@/lib/design-tokens';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { DISPLAY_LIMITS } from '@/lib/config/dashboard-config';

interface OverdueCheckoutsCardProps {
  overdueCheckouts: OverdueCheckout[];
  upcomingCheckoutReturns?: UpcomingCheckoutReturn[];
  loading?: boolean;
}

export function OverdueCheckoutsCard({
  overdueCheckouts,
  upcomingCheckoutReturns = [],
  loading = false,
}: OverdueCheckoutsCardProps) {
  const t = useTranslations('dashboard.overdueCheckouts');
  const [activeTab, setActiveTab] = useState<'overdue' | 'upcoming'>('overdue');

  if (loading) {
    return (
      <div className={T.containerLoading}>
        <div className={T.header}>
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
    <div className={T.container} role="region" aria-label={t('ariaLabel')}>
      {/* 헤더 */}
      <div className={T.header}>
        <h2 className={T.title}>{t('title')}</h2>
        {activeTab === 'overdue' && overdueCheckouts.length > 0 && (
          <span className={T.countAlert}>{t('count', { count: overdueCheckouts.length })}</span>
        )}
      </div>

      {/* 내부 탭 스트립 */}
      <div className={T.tabBar} role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'overdue'}
          onClick={() => setActiveTab('overdue')}
          className={cn(T.tab, activeTab === 'overdue' && T.tabActive)}
        >
          {t('tabOverdue')} ({overdueCheckouts.length})
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'upcoming'}
          onClick={() => setActiveTab('upcoming')}
          className={cn(T.tab, activeTab === 'upcoming' && T.tabActive)}
        >
          {t('tabUpcoming')} ({upcomingCheckoutReturns.length})
        </button>
      </div>

      {/* 기한 초과 탭 */}
      {activeTab === 'overdue' &&
        (overdueCheckouts.length > 0 ? (
          <div className={T.listWrapper}>
            <div className={T.list}>
              {overdueCheckouts.slice(0, DISPLAY_LIMITS.overdueCheckouts).map((item) => (
                <Link
                  key={item.id}
                  href={FRONTEND_ROUTES.CHECKOUTS.DETAIL(item.id)}
                  className={T.item}
                  aria-label={`${item.equipment?.name ?? ''} ${t('daysOverdue', { days: item.daysOverdue })}`}
                >
                  <span className={T.dday}>{t('daysOverdue', { days: item.daysOverdue })}</span>
                  <div className={T.info}>
                    <div className={T.name}>{item.equipment?.name ?? ''}</div>
                    {item.user?.name && <div className={T.user}>{item.user.name}</div>}
                  </div>
                  <ArrowRight className={cn(T.arrow)} aria-hidden="true" />
                </Link>
              ))}
            </div>
            {overdueCheckouts.length > 3 && <div className={T.listFade} />}
          </div>
        ) : (
          <div className={ES.inline.container}>
            <CheckCircle2 className={ES.inline.icon} aria-hidden="true" />
            <p className={ES.inline.text}>{t('empty')}</p>
          </div>
        ))}

      {/* 반납 예정 탭 */}
      {activeTab === 'upcoming' &&
        (upcomingCheckoutReturns.length > 0 ? (
          <div className={T.listWrapper}>
            <div className={T.list}>
              {upcomingCheckoutReturns
                .slice(0, DISPLAY_LIMITS.upcomingCheckoutReturns)
                .map((item) => (
                  <Link
                    key={item.id}
                    href={FRONTEND_ROUTES.CHECKOUTS.DETAIL(item.id)}
                    className={T.item}
                    aria-label={`${item.equipmentName} ${t('daysUntilReturn', { days: item.daysUntilReturn })}`}
                  >
                    <span className={T.ddayReturn}>
                      {t('daysUntilReturn', { days: item.daysUntilReturn })}
                    </span>
                    <div className={T.info}>
                      <div className={T.name}>{item.equipmentName}</div>
                      <div className={T.user}>{item.managementNumber}</div>
                    </div>
                    <ArrowRight className={cn(T.arrow)} aria-hidden="true" />
                  </Link>
                ))}
            </div>
            {upcomingCheckoutReturns.length > 3 && <div className={T.listFade} />}
          </div>
        ) : (
          <div className={ES.inline.container}>
            <CheckCircle2 className={ES.inline.icon} aria-hidden="true" />
            <p className={ES.inline.text}>{t('upcomingEmpty')}</p>
          </div>
        ))}
    </div>
  );
}
