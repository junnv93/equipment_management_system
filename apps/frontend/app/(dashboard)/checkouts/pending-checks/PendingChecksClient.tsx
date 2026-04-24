'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useTranslations, useFormatter } from 'next-intl';
import { AlertCircle, ArrowRight, Package, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import checkoutApi, { Checkout } from '@/lib/api/checkout-api';
import type { PaginatedResponse } from '@/lib/api/types';
import type { CheckoutStatus } from '@equipment-management/schemas';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { CheckoutStatusBadge } from '@/components/checkouts/CheckoutStatusBadge';
import { TRANSITION_PRESETS, getPageContainerClasses } from '@/lib/design-tokens';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/shared/ErrorState';

type PendingCheckRole = 'all' | 'lender' | 'borrower';

interface PendingChecksClientProps {
  initialData: PaginatedResponse<Checkout>;
  /**
   * 서버가 initialData를 fetch할 때 사용한 role.
   * activeRole과 일치할 때만 placeholderData로 사용 — role 불일치로 인한
   * 잘못된 데이터 플래시를 방지한다.
   */
  initialRole: PendingCheckRole;
}

/**
 * 현재 상태에서 필요한 확인 단계 i18n key 매핑
 */
const PENDING_CHECK_KEY_MAP: Partial<
  Record<CheckoutStatus, { labelKey: string; roleKey: string }>
> = {
  approved: {
    labelKey: 'pendingChecks.labels.preCheckout',
    roleKey: 'pendingChecks.roles.lender',
  },
  lender_checked: {
    labelKey: 'pendingChecks.labels.receiveCheck',
    roleKey: 'pendingChecks.roles.borrower',
  },
  borrower_received: {
    labelKey: 'pendingChecks.labels.preReturn',
    roleKey: 'pendingChecks.roles.borrower',
  },
  in_use: {
    labelKey: 'pendingChecks.labels.preReturn',
    roleKey: 'pendingChecks.roles.borrower',
  },
  borrower_returned: {
    labelKey: 'pendingChecks.labels.returnCheck',
    roleKey: 'pendingChecks.roles.lender',
  },
};

/**
 * 확인 필요 목록 Client Component
 *
 * 현재 사용자가 확인해야 할 대여 건 목록을 표시합니다.
 */
export default function PendingChecksClient({
  initialData,
  initialRole,
}: PendingChecksClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('checkouts');
  const formatter = useFormatter();

  // URL searchParams에서 role 필터 읽기 (SSOT)
  const activeRole = (searchParams.get('role') as PendingCheckRole) || 'all';

  const setRole = useCallback(
    (role: PendingCheckRole) => {
      const params = new URLSearchParams(searchParams.toString());
      if (role === 'all') {
        params.delete('role');
      } else {
        params.set('role', role);
      }
      const query = params.toString();
      // router.replace: 탭 전환은 URL 상태 변경이므로 히스토리 스택에 추가할 필요 없다.
      // push를 쓰면 뒤로가기 시 탭 사이를 순회하게 되어 UX가 나빠진다.
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // API에 전달할 role (all이면 undefined)
  const apiRole = activeRole === 'all' ? undefined : activeRole;

  // 확인 필요 목록 조회
  // placeholderData는 서버가 fetch한 role(initialRole)과 현재 탭(activeRole)이 일치할 때만 사용.
  // 서버는 URL role에 맞는 데이터를 fetch하므로 initialData는 initialRole 전용 데이터다.
  // role 불일치 시 undefined → 올바른 데이터가 아닌 것이 잠깐 보이는 버그를 차단한다.
  const {
    data: checksData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.checkouts.pending(apiRole),
    queryFn: async () => {
      return checkoutApi.getPendingChecks(apiRole ? { role: apiRole } : {});
    },
    placeholderData: activeRole === initialRole ? initialData : undefined,
    staleTime: CACHE_TIMES.SHORT,
  });

  // 빈 상태 렌더링
  const renderEmptyState = () => (
    <Card className="text-center py-12">
      <CardContent>
        <CheckCircle2 className="h-16 w-16 text-brand-ok mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">{t('pendingChecks.empty.title')}</h3>
        <p className="text-muted-foreground">{t('pendingChecks.empty.description')}</p>
      </CardContent>
    </Card>
  );

  // 확인 항목 카드 렌더링
  const renderCheckItem = (checkout: Checkout) => {
    const checkKeys = PENDING_CHECK_KEY_MAP[checkout.status];
    if (!checkKeys) return null;

    const label = t(checkKeys.labelKey as Parameters<typeof t>[0]);
    const role = t(checkKeys.roleKey as Parameters<typeof t>[0]);

    const purposeLabel = t(`purpose.${checkout.purpose}`);

    return (
      <Card key={checkout.id} className={`hover:shadow-md ${TRANSITION_PRESETS.fastShadow}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-brand-warning/10 text-brand-warning">
                <AlertCircle className="h-3 w-3 mr-1" />
                {t('pendingChecks.badge.required')}
              </Badge>
              <Badge variant="secondary">{role}</Badge>
            </div>
            <CheckoutStatusBadge status={checkout.status} />
          </div>
          <CardTitle className="text-lg mt-2">
            {checkout.equipment?.[0]?.name || t('pendingChecks.noEquipmentInfo')}
            {checkout.equipment && checkout.equipment.length > 1 && (
              <span className="text-muted-foreground font-normal text-sm ml-2">
                {t('pendingChecks.equipmentMore', { count: checkout.equipment.length - 1 })}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {purposeLabel} - {checkout.destination}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* 장비 정보 */}
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {t('pendingChecks.fields.managementNumber')}
              </span>
              <span>{checkout.equipment?.[0]?.managementNumber || '-'}</span>
            </div>

            {/* 반입 예정일 */}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {t('pendingChecks.fields.expectedReturn')}
              </span>
              <span>
                {formatter.dateTime(new Date(checkout.expectedReturnDate), { dateStyle: 'long' })}
              </span>
            </div>

            {/* 필요한 확인 안내 */}
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{label}</AlertTitle>
              <AlertDescription>{t('pendingChecks.alertDescription', { label })}</AlertDescription>
            </Alert>

            {/* 확인 버튼 */}
            <div className="flex justify-end mt-4">
              <Button asChild>
                <Link href={FRONTEND_ROUTES.CHECKOUTS.CHECK(checkout.id)}>
                  {t('pendingChecks.actionButton', { label })}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={getPageContainerClasses('list', '')}>
      {/* 헤더 */}
      <div className="mb-6">
        <PageHeader
          title={t('pendingChecks.title')}
          subtitle={t('pendingChecks.subtitle')}
          actions={
            <Button variant="outline" onClick={() => router.push(FRONTEND_ROUTES.CHECKOUTS.LIST)}>
              {t('pendingChecks.backToList')}
            </Button>
          }
        />
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeRole === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setRole('all')}
        >
          {t('pendingChecks.filters.all')}
        </Button>
        <Button
          variant={activeRole === 'lender' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setRole('lender')}
        >
          {t('pendingChecks.filters.lender')}
        </Button>
        <Button
          variant={activeRole === 'borrower' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setRole('borrower')}
        >
          {t('pendingChecks.filters.borrower')}
        </Button>
      </div>

      {/* 목록 */}
      {isLoading ? (
        <div className="text-center py-12">{t('pendingChecks.loading')}</div>
      ) : isError ? (
        <div className="py-16 flex justify-center">
          <ErrorState title={t('pendingChecks.error')} onRetry={() => void refetch()} />
        </div>
      ) : checksData?.data?.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {checksData?.data?.map((checkout: Checkout) => renderCheckItem(checkout))}
        </div>
      )}
    </div>
  );
}
