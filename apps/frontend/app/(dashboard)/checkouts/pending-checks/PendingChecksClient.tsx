'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AlertCircle, ArrowRight, Package, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import checkoutApi, { Checkout } from '@/lib/api/checkout-api';
import type { PaginatedResponse } from '@/lib/api/types';
import { CHECKOUT_PURPOSE_LABELS, CheckoutStatus } from '@equipment-management/schemas';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { CheckoutStatusBadge } from '@/components/checkouts/CheckoutStatusBadge';

interface PendingChecksClientProps {
  initialData: PaginatedResponse<Checkout>;
}

/**
 * 현재 상태에서 필요한 확인 단계 라벨
 */
const PENDING_CHECK_LABELS: Partial<Record<CheckoutStatus, { label: string; role: string }>> = {
  approved: { label: '반출 전 확인', role: '빌려주는 측' },
  lender_checked: { label: '인수 확인', role: '빌리는 측' },
  borrower_received: { label: '반납 전 확인', role: '빌리는 측' },
  in_use: { label: '반납 전 확인', role: '빌리는 측' },
  borrower_returned: { label: '반입 확인', role: '빌려주는 측' },
};

/**
 * 확인 필요 목록 Client Component
 *
 * 현재 사용자가 확인해야 할 대여 건 목록을 표시합니다.
 */
export default function PendingChecksClient({ initialData }: PendingChecksClientProps) {
  const router = useRouter();
  const [_filter, setFilter] = useState<'all' | 'lender' | 'borrower'>('all');

  // 확인 필요 목록 조회
  const { data: checksData, isLoading } = useQuery({
    queryKey: ['pending-checks'],
    queryFn: async () => {
      return checkoutApi.getPendingChecks();
    },
    placeholderData: initialData,
    staleTime: 30 * 1000,
  });

  // 빈 상태 렌더링
  const renderEmptyState = () => (
    <Card className="text-center py-12">
      <CardContent>
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">확인할 항목이 없습니다</h3>
        <p className="text-muted-foreground">현재 확인이 필요한 대여 건이 없습니다.</p>
      </CardContent>
    </Card>
  );

  // 확인 항목 카드 렌더링
  const renderCheckItem = (checkout: Checkout) => {
    const checkInfo = PENDING_CHECK_LABELS[checkout.status];
    if (!checkInfo) return null;

    const purposeLabel =
      CHECKOUT_PURPOSE_LABELS[checkout.purpose as keyof typeof CHECKOUT_PURPOSE_LABELS] ||
      checkout.purpose;

    return (
      <Card key={checkout.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                <AlertCircle className="h-3 w-3 mr-1" />
                확인 필요
              </Badge>
              <Badge variant="secondary">{checkInfo.role}</Badge>
            </div>
            <CheckoutStatusBadge status={checkout.status} />
          </div>
          <CardTitle className="text-lg mt-2">
            {checkout.equipment?.[0]?.name || '장비 정보 없음'}
            {checkout.equipment && checkout.equipment.length > 1 && (
              <span className="text-muted-foreground font-normal text-sm ml-2">
                외 {checkout.equipment.length - 1}건
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
              <span className="text-muted-foreground">관리번호:</span>
              <span>{checkout.equipment?.[0]?.managementNumber || '-'}</span>
            </div>

            {/* 반입 예정일 */}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">반입 예정일:</span>
              <span>
                {format(new Date(checkout.expectedReturnDate), 'yyyy년 MM월 dd일', { locale: ko })}
              </span>
            </div>

            {/* 필요한 확인 안내 */}
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{checkInfo.label}</AlertTitle>
              <AlertDescription>이 항목에 대해 {checkInfo.label}이 필요합니다.</AlertDescription>
            </Alert>

            {/* 확인 버튼 */}
            <div className="flex justify-end mt-4">
              <Button asChild>
                <Link href={`/checkouts/${checkout.id}/check`}>
                  {checkInfo.label} 진행
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
          <h1 className="text-3xl font-bold tracking-tight">확인 필요 목록</h1>
          <p className="text-muted-foreground">내가 확인해야 할 대여 건 목록입니다.</p>
        </div>
        <Button variant="outline" onClick={() => router.push(FRONTEND_ROUTES.CHECKOUTS.LIST)}>
          반출 목록으로
        </Button>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={_filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          전체
        </Button>
        <Button
          variant={_filter === 'lender' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('lender')}
        >
          빌려주는 측
        </Button>
        <Button
          variant={_filter === 'borrower' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('borrower')}
        >
          빌리는 측
        </Button>
      </div>

      {/* 목록 */}
      {isLoading ? (
        <div className="text-center py-12">데이터를 불러오는 중...</div>
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
