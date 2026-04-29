/**
 * CheckoutCard — scope 통합 반출 현황 카드 (대시보드 개선안 §3.4 + §A.7)
 *
 * **Dual-mode 컴포넌트 패턴 (controlled / uncontrolled)**:
 *  - **Controlled** (DashboardClient 사용): `overdueCheckouts` + `upcomingCheckoutReturns` 명시적 전달 →
 *    부모가 이미 dashboard aggregate에서 fetch한 데이터 활용 (중복 fetch 방지).
 *  - **Uncontrolled** (다른 페이지 재사용): props 미전달 시 자체 `useQuery`로 fetch.
 *    `/api/dashboard/checkouts?scope={scope}` 호출.
 *
 * 단일 컴포넌트 + scope prop으로 시험실무자(me)/기술책임자(team)/시험소장(lab)/시스템관리자(all) 모두 처리.
 *
 * 모든 표시 문자열은 i18n 키 (`dashboard.checkoutCard.*`).
 */

'use client';

import { useState } from 'react';
import { NavLink } from '@/components/navigation/nav-link';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { DDayTag } from '@/components/dashboard/atoms/DDayTag';
import { EmptyState } from '@/components/dashboard/atoms/EmptyState';
import {
  dashboardApi,
  type OverdueCheckout,
  type UpcomingCheckoutReturn,
  type DashboardCheckoutsScope,
} from '@/lib/api/dashboard-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { FRONTEND_ROUTES, type DashboardScope } from '@equipment-management/shared-constants';

export type CheckoutCardScope = DashboardScope;

interface CheckoutCardProps {
  scope: CheckoutCardScope;
  /**
   * Controlled 모드: 부모가 aggregate에서 받은 데이터를 전달하면 자체 fetch 생략.
   * 두 props 모두 지정하거나 모두 생략해야 함 (혼합 시 컴파일러가 강제하진 않지만 권장 패턴).
   */
  overdueCheckouts?: OverdueCheckout[];
  upcomingCheckoutReturns?: UpcomingCheckoutReturn[];
  /** scope='me' 전용: 대기 중인 반출 신청 건수. 미지정 시 푸터 미표시. */
  pendingRequests?: number;
  loading?: boolean;
  className?: string;
}

const TABS = [
  { value: 'upcoming' as const, key: 'upcoming' as const },
  { value: 'overdue' as const, key: 'overdue' as const },
];

export function CheckoutCard({
  scope,
  overdueCheckouts: overdueProp,
  upcomingCheckoutReturns: upcomingProp,
  pendingRequests: pendingRequestsProp,
  loading: loadingProp,
  className,
}: CheckoutCardProps) {
  const t = useTranslations('dashboard.checkoutCard');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'overdue'>('upcoming');

  // Uncontrolled mode: 부모가 데이터를 전달하지 않으면 자체 fetch.
  const isControlled = upcomingProp !== undefined && overdueProp !== undefined;
  const { data: scopeData, isLoading: isFetching } = useQuery<DashboardCheckoutsScope>({
    queryKey: queryKeys.dashboard.checkouts(scope),
    queryFn: () => dashboardApi.getCheckoutsByScope(scope),
    enabled: !isControlled,
    ...QUERY_CONFIG.DASHBOARD,
  });

  // Controlled props 우선, 없으면 fetch 결과 사용.
  const upcomingCheckoutReturns =
    upcomingProp ??
    scopeData?.pendingReturns.map((item) => ({
      id: item.id,
      checkoutItemId: item.checkoutItemId,
      equipmentName: item.equipmentName,
      managementNumber: item.managementNumber ?? '',
      expectedReturnDate: item.expectedReturnDate,
      // 부호 규약: backend `daysUntilDue` = expectedReturnDate - today (양수=남은 일수,
      // 0=오늘, 음수=초과). frontend `daysUntilReturn`도 동일 규약(양수=남은 일수)이므로
      // 직접 매핑한다. DDayTag에 전달할 때 -daysUntilReturn로 부호 반전 (DDayTag는 음수=남은).
      daysUntilReturn: item.daysUntilDue,
      purpose: '',
    })) ??
    [];
  // overdueCheckouts: controlled 모드는 props, uncontrolled는 backend overdueCount만 알 수 있어 빈 배열 fallback.
  // backend가 overdue 항목 리스트를 반환하지 않으므로 uncontrolled 모드는 카운트만 표시.
  const overdueCheckouts: OverdueCheckout[] = overdueProp ?? [];
  const overdueDisplayCount = overdueProp ? overdueProp.length : (scopeData?.overdueCount ?? 0);
  const pendingRequests =
    pendingRequestsProp ?? (isControlled ? undefined : scopeData?.pendingRequests);
  const loading = loadingProp ?? (!isControlled && isFetching);

  const title = t(`title.${scope}` as Parameters<typeof t>[0]);
  const sub = t(`sub.${scope}` as Parameters<typeof t>[0]);

  if (loading) {
    return (
      <Card className={cn('p-4', className)} aria-label={title}>
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-7 w-full mb-3 rounded-md" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-sm" />
          ))}
        </div>
      </Card>
    );
  }

  const upcomingCount = upcomingCheckoutReturns.length;
  const overdueCount = overdueDisplayCount;
  const totalActive = upcomingCount + overdueCount;
  const showPendingFooter = scope === 'me' && pendingRequests != null;

  return (
    <Card className={cn('p-4 flex flex-col h-full', className)} role="region" aria-label={title}>
      <header className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          <p className="text-[11px] text-muted-foreground">{sub}</p>
        </div>
        <div className="flex items-center gap-2">
          {totalActive > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-success/10 text-brand-success font-semibold">
              {t('activeBadge', { count: totalActive })}
            </span>
          )}
          <NavLink
            href={FRONTEND_ROUTES.CHECKOUTS.LIST}
            variant="card"
            className="text-[11px] text-brand-info font-medium hover:underline"
          >
            {t('viewAll')}
          </NavLink>
        </div>
      </header>

      {/* Tabs */}
      <div
        className="inline-flex items-center gap-0.5 p-0.5 rounded-md bg-muted self-start mb-2.5"
        role="tablist"
      >
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'px-2.5 py-1 rounded text-[11px] font-medium motion-safe:transition-colors',
              activeTab === tab.value
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t(`tab.${tab.key}` as Parameters<typeof t>[0])}
            <span
              className={cn(
                'ml-1 text-[10px] tabular-nums px-1 rounded',
                activeTab === tab.value
                  ? tab.value === 'overdue'
                    ? 'bg-brand-critical/10 text-brand-critical'
                    : 'bg-brand-info/10 text-brand-info'
                  : 'bg-muted-foreground/10 text-muted-foreground'
              )}
            >
              {tab.value === 'upcoming' ? upcomingCount : overdueCount}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === 'upcoming' &&
          (upcomingCheckoutReturns.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border" role="list">
              {upcomingCheckoutReturns.slice(0, 5).map((item) => (
                <li key={item.checkoutItemId} className="py-2">
                  <NavLink
                    href={FRONTEND_ROUTES.CHECKOUTS.DETAIL(item.id)}
                    pendingIndicator="opacity"
                    className="flex items-center justify-between gap-3 hover:bg-muted/40 -mx-1 px-1 rounded-sm motion-safe:transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium truncate">{item.equipmentName}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {item.managementNumber}
                      </div>
                    </div>
                    <DDayTag days={-item.daysUntilReturn} size="sm" />
                  </NavLink>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              variant="success"
              title={t('upcomingEmptyTitle')}
              description={t('upcomingEmptyDescription')}
              role="status"
              className="py-5"
            />
          ))}

        {activeTab === 'overdue' &&
          (overdueCheckouts.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border" role="list">
              {overdueCheckouts.slice(0, 5).map((item) => (
                <li key={item.checkoutItemId} className="py-2">
                  <NavLink
                    href={FRONTEND_ROUTES.CHECKOUTS.DETAIL(item.id)}
                    pendingIndicator="opacity"
                    className="flex items-center justify-between gap-3 hover:bg-muted/40 -mx-1 px-1 rounded-sm motion-safe:transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium truncate">
                        {item.equipment?.name ?? ''}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {[item.teamName, item.user?.name].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <DDayTag days={item.daysOverdue} size="sm" />
                  </NavLink>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              variant="success"
              title={t('overdueEmptyTitle')}
              description={t('overdueEmptyDescription')}
              role="status"
              className="py-5"
            />
          ))}
      </div>

      {showPendingFooter && (
        <div className="mt-3 pt-2.5 border-t border-dashed border-border flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{t('pendingRequestsLabel')}</span>
          <span className="font-semibold text-foreground tabular-nums">
            {t('countSuffix', { count: pendingRequests })}
          </span>
        </div>
      )}
    </Card>
  );
}
