'use client';

import { useMemo, useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, Clock, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import checkoutApi, { type CheckoutQuery } from '@/lib/api/checkout-api';
import { CACHE_TIMES } from '@/lib/api/query-config';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import CheckoutGroupCard from '@/components/checkouts/CheckoutGroupCard';
import { groupCheckoutsByDateAndDestination } from '@/lib/utils/checkout-group-utils';

interface OutboundCheckoutsTabProps {
  teamId?: string;
  statusFilter: string;
  locationFilter: string;
  searchTerm: string;
  summary: {
    total: number;
    pending: number;
    approved: number;
    overdue: number;
    returnedToday: number;
  };
  onStatCardClick: (status: string) => void;
  onResetFilters: () => void;
}

/**
 * 반출 탭 컴포넌트
 * ✅ 코드 분할: 반출 관련 로직만 포함 (Bundle size optimization)
 */
export default function OutboundCheckoutsTab({
  teamId,
  statusFilter,
  locationFilter,
  searchTerm,
  summary,
  onStatCardClick,
  onResetFilters,
}: OutboundCheckoutsTabProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  // 필터 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, locationFilter, searchTerm, teamId]);

  // ──────────────────────────────────────────────
  // 반출 목록 조회 (페이지네이션)
  // ──────────────────────────────────────────────
  const { data: checkoutsData, isLoading: checkoutsLoading } = useQuery({
    queryKey: [
      'checkouts',
      'outbound',
      statusFilter,
      locationFilter,
      searchTerm,
      teamId,
      currentPage,
    ],
    queryFn: async () => {
      const query: CheckoutQuery = {
        page: currentPage,
        pageSize: 20,
        search: searchTerm || undefined,
        teamId,
        direction: 'outbound',
        includeSummary: true,
      };

      if (statusFilter !== 'all') {
        query.statuses = statusFilter;
      }

      if (locationFilter !== 'all') {
        query.destination = locationFilter;
      }

      return checkoutApi.getCheckouts(query);
    },
    staleTime: CACHE_TIMES.SHORT,
  });

  // ──────────────────────────────────────────────
  // 그룹화
  // ──────────────────────────────────────────────
  const outboundGroups = useMemo(() => {
    if (!checkoutsData?.data) return [];
    return groupCheckoutsByDateAndDestination(checkoutsData.data);
  }, [checkoutsData?.data]);

  // ──────────────────────────────────────────────
  // Render helpers
  // ──────────────────────────────────────────────
  const renderLoadingState = () => (
    <>
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-4">
              <Skeleton className="h-5 w-[100px]" />
              <Skeleton className="h-5 w-[120px]" />
              <Skeleton className="h-5 w-[60px]" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-[60px]" />
              <Skeleton className="h-5 w-[50px]" />
            </div>
          </div>
        </Card>
      ))}
    </>
  );

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <ClipboardList className="h-12 w-12 text-gray-400 mb-4" aria-hidden="true" />
      <h3 className="text-lg font-medium text-gray-900">반출 정보가 없습니다</h3>
      <p className="text-sm text-gray-500 mt-2 mb-4">검색 조건에 맞는 정보가 없습니다.</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onResetFilters}>
          필터 초기화
        </Button>
      </div>
    </div>
  );

  // ──────────────────────────────────────────────
  // 통계 카드
  // ──────────────────────────────────────────────
  const renderStats = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card
        className={`cursor-pointer transition-colors hover:border-primary/50 ${statusFilter === 'all' && locationFilter === 'all' && !searchTerm ? 'border-primary bg-primary/5' : ''}`}
        onClick={() => {
          onResetFilters();
        }}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">전체 반출</CardTitle>
          <ClipboardList className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tabular-nums">{summary.total}</div>
        </CardContent>
      </Card>
      <Card
        className={`cursor-pointer transition-colors hover:border-amber-400 ${statusFilter === 'pending' ? 'border-amber-400 bg-amber-50' : ''}`}
        onClick={() => onStatCardClick('pending')}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">승인 대기</CardTitle>
          <Clock className="h-4 w-4 text-amber-600" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tabular-nums">{summary.pending}</div>
        </CardContent>
      </Card>
      <Card
        className={`cursor-pointer transition-colors hover:border-red-400 ${statusFilter === 'overdue' ? 'border-red-400 bg-red-50' : ''}`}
        onClick={() => onStatCardClick('overdue')}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">기한 초과</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tabular-nums">{summary.overdue}</div>
        </CardContent>
      </Card>
      <Card
        className={`cursor-pointer transition-colors hover:border-blue-400 ${statusFilter === 'checked_out,lender_checked,borrower_received,in_use,borrower_returned,lender_received' ? 'border-blue-400 bg-blue-50' : ''}`}
        onClick={() =>
          onStatCardClick(
            'checked_out,lender_checked,borrower_received,in_use,borrower_returned,lender_received'
          )
        }
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">오늘 반입 예정</CardTitle>
          <Clock className="h-4 w-4 text-blue-600" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tabular-nums">{summary.returnedToday}</div>
        </CardContent>
      </Card>
    </div>
  );

  // ──────────────────────────────────────────────
  // Main render
  // ──────────────────────────────────────────────
  return (
    <>
      {/* 통계 카드 */}
      {renderStats()}

      {/* 목록 */}
      <div className="space-y-3">
        {checkoutsLoading
          ? renderLoadingState()
          : outboundGroups.length === 0
            ? renderEmptyState()
            : outboundGroups.map((group) => (
                <CheckoutGroupCard
                  key={group.key}
                  group={group}
                  onCheckoutClick={(id) => router.push(FRONTEND_ROUTES.CHECKOUTS.DETAIL(id))}
                />
              ))}
      </div>

      {/* 페이지네이션 */}
      {checkoutsData && checkoutsData.meta.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1 || checkoutsLoading}
          >
            이전
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {checkoutsData.meta.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((p) => Math.min(checkoutsData.meta.pagination.totalPages, p + 1))
            }
            disabled={currentPage === checkoutsData.meta.pagination.totalPages || checkoutsLoading}
          >
            다음
          </Button>
        </div>
      )}
    </>
  );
}
