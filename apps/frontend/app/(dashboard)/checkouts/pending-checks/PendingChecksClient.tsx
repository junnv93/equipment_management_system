'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { CHECKOUT_PURPOSE_LABELS, CheckoutStatus } from '@equipment-management/schemas';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { CheckoutStatusBadge } from '@/components/checkouts/CheckoutStatusBadge';
import { TRANSITION_PRESETS } from '@/lib/design-tokens';

interface PendingChecksClientProps {
  initialData: PaginatedResponse<Checkout>;
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
export default function PendingChecksClient({ initialData }: PendingChecksClientProps) {
  const router = useRouter();
  const t = useTranslations('checkouts');
  const formatter = useFormatter();
  const [_filter, setFilter] = useState<'all' | 'lender' | 'borrower'>('all');

  // 확인 필요 목록 조회
  const { data: checksData, isLoading } = useQuery({
    queryKey: queryKeys.checkouts.pending(),
    queryFn: async () => {
      return checkoutApi.getPendingChecks();
    },
    placeholderData: initialData,
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

    const purposeLabel =
      CHECKOUT_PURPOSE_LABELS[checkout.purpose as keyof typeof CHECKOUT_PURPOSE_LABELS] ||
      checkout.purpose;

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
                <Link href={`/checkouts/${checkout.id}/check`}>
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
    <div className="container mx-auto py-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('pendingChecks.title')}</h1>
          <p className="text-muted-foreground">{t('pendingChecks.subtitle')}</p>
        </div>
        <Button variant="outline" onClick={() => router.push(FRONTEND_ROUTES.CHECKOUTS.LIST)}>
          {t('pendingChecks.backToList')}
        </Button>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={_filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          {t('pendingChecks.filters.all')}
        </Button>
        <Button
          variant={_filter === 'lender' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('lender')}
        >
          {t('pendingChecks.filters.lender')}
        </Button>
        <Button
          variant={_filter === 'borrower' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('borrower')}
        >
          {t('pendingChecks.filters.borrower')}
        </Button>
      </div>

      {/* 목록 */}
      {isLoading ? (
        <div className="text-center py-12">{t('pendingChecks.loading')}</div>
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
