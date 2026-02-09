'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ClipboardList,
  Clock,
  Search,
  Plus,
  Filter,
  MapPin,
  PackagePlus,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import checkoutApi, { Checkout, CheckoutQuery } from '@/lib/api/checkout-api';
import rentalImportApi from '@/lib/api/rental-import-api';
import type { PaginatedResponse } from '@/lib/api/types';
import {
  CHECKOUT_STATUS_LABELS,
  CHECKOUT_STATUS_FILTER_OPTIONS,
  RENTAL_IMPORT_STATUS_VALUES,
  RENTAL_IMPORT_STATUS_LABELS,
  CLASSIFICATION_LABELS,
  type RentalImportStatus,
  type Classification,
} from '@equipment-management/schemas';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { RentalImportStatusBadge } from '@/components/rental-imports/RentalImportStatusBadge';
import CheckoutGroupCard from '@/components/checkouts/CheckoutGroupCard';
import { groupCheckoutsByDateAndDestination } from '@/lib/utils/checkout-group-utils';

// ============================================================================
// Types
// ============================================================================

interface CheckoutSummary {
  total: number;
  pending: number;
  approved: number;
  overdue: number;
  returnedToday: number;
}

type ViewMode = 'outbound' | 'inbound';

interface CheckoutsContentProps {
  /** 서버에서 가져온 초기 반출 목록 */
  initialData: PaginatedResponse<Checkout>;
  /** 서버에서 가져온 초기 요약 정보 */
  initialSummary: CheckoutSummary;
  /** URL에서 읽은 초기 뷰 모드 */
  initialView?: ViewMode;
}

// ============================================================================
// Helpers
// ============================================================================

/** 기존 `?tab=rental_imports` URL을 새 `?view=inbound`로 매핑 */
function resolveInitialView(initialView?: string): ViewMode {
  if (initialView === 'inbound') return 'inbound';
  return 'outbound';
}

// ============================================================================
// Component
// ============================================================================

/**
 * 반출입 관리 Client Component
 *
 * 2탭 구조:
 * - [반출] 우리 팀 장비가 나가는 건 (교정/수리 + 타팀이 우리 장비를 빌려감)
 * - [반입] 외부 장비가 들어오는 건 (타팀 장비 대여 + 외부 업체 렌탈)
 */
export default function CheckoutsContent({
  initialData,
  initialSummary,
  initialView,
}: CheckoutsContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const teamId = session?.user?.teamId;

  const [currentView, setCurrentView] = useState<ViewMode>(resolveInitialView(initialView));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  const isInbound = currentView === 'inbound';

  // ──────────────────────────────────────────────
  // 통계 요약 (반출 탭용)
  // ──────────────────────────────────────────────
  const { data: querySummary } = useQuery({
    queryKey: ['checkout-summary', teamId],
    queryFn: async () => {
      const [allRes, pendingRes, overdueRes, todayRes] = await Promise.all([
        checkoutApi.getCheckouts({ pageSize: 1, teamId, direction: 'outbound' }),
        checkoutApi.getCheckouts({
          pageSize: 1,
          teamId,
          direction: 'outbound',
          statuses: 'pending',
        }),
        checkoutApi.getCheckouts({
          pageSize: 1,
          teamId,
          direction: 'outbound',
          statuses: 'overdue',
        }),
        checkoutApi.getCheckouts({
          pageSize: 1,
          teamId,
          direction: 'outbound',
          endDate: new Date().toISOString().split('T')[0],
          statuses:
            'checked_out,lender_checked,borrower_received,in_use,borrower_returned,lender_received',
        }),
      ]);
      return {
        total: allRes.meta.pagination.total,
        pending: pendingRes.meta.pagination.total,
        approved: 0,
        overdue: overdueRes.meta.pagination.total,
        returnedToday: todayRes.meta.pagination.total,
      };
    },
    initialData: initialSummary,
    staleTime: 30 * 1000,
    enabled: !isInbound,
  });
  const summary = querySummary ?? initialSummary;

  // ──────────────────────────────────────────────
  // 반출 목록 (outbound 탭)
  // ──────────────────────────────────────────────
  const { data: checkoutsData, isLoading: checkoutsLoading } = useQuery({
    queryKey: ['checkouts', 'outbound', statusFilter, locationFilter, searchTerm, teamId],
    queryFn: async () => {
      const query: CheckoutQuery = {
        pageSize: 100,
        search: searchTerm || undefined,
        teamId,
        direction: 'outbound',
      };

      if (statusFilter !== 'all') {
        query.statuses = statusFilter;
      }

      if (locationFilter !== 'all') {
        query.destination = locationFilter;
      }

      return checkoutApi.getCheckouts(query);
    },
    initialData:
      currentView === 'outbound' &&
      statusFilter === 'all' &&
      locationFilter === 'all' &&
      !searchTerm
        ? initialData
        : undefined,
    staleTime: 30 * 1000,
    enabled: !isInbound,
  });

  // ──────────────────────────────────────────────
  // 반입: 타팀 장비 대여 건 (inbound 탭)
  // ──────────────────────────────────────────────
  const { data: inboundCheckoutsData, isLoading: inboundCheckoutsLoading } = useQuery({
    queryKey: ['checkouts', 'inbound', statusFilter, searchTerm, teamId],
    queryFn: async () => {
      const query: CheckoutQuery = {
        pageSize: 100,
        search: searchTerm || undefined,
        teamId,
        direction: 'inbound',
      };

      if (statusFilter !== 'all') {
        query.statuses = statusFilter;
      }

      return checkoutApi.getCheckouts(query);
    },
    staleTime: 30 * 1000,
    enabled: isInbound,
  });

  // ──────────────────────────────────────────────
  // 반입: 외부 업체 렌탈 (inbound 탭 하단)
  // ──────────────────────────────────────────────
  const { data: rentalImportsData, isLoading: rentalImportsLoading } = useQuery({
    queryKey: ['rental-imports', statusFilter, searchTerm],
    queryFn: () =>
      rentalImportApi.getList({
        limit: 100,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
    enabled: isInbound,
    staleTime: 30 * 1000,
  });

  // ──────────────────────────────────────────────
  // 반출지 목록 (DB 기반)
  // ──────────────────────────────────────────────
  const { data: destinations } = useQuery({
    queryKey: ['checkout-destinations'],
    queryFn: () => checkoutApi.getDestinations(),
    staleTime: 5 * 60 * 1000,
  });

  // ──────────────────────────────────────────────
  // 그룹화 (반출 탭용)
  // ──────────────────────────────────────────────
  const outboundGroups = useMemo(() => {
    if (!checkoutsData?.data) return [];
    return groupCheckoutsByDateAndDestination(checkoutsData.data);
  }, [checkoutsData?.data]);

  const inboundGroups = useMemo(() => {
    if (!inboundCheckoutsData?.data) return [];
    return groupCheckoutsByDateAndDestination(inboundCheckoutsData.data);
  }, [inboundCheckoutsData?.data]);

  // ──────────────────────────────────────────────
  // 핸들러
  // ──────────────────────────────────────────────

  const handleViewChange = useCallback(
    (value: string) => {
      const newView = value as ViewMode;
      setCurrentView(newView);
      setStatusFilter('all');
      setLocationFilter('all');
      setSearchTerm('');

      // URL에 view 상태 반영 (뒤로가기 시 탭 유지)
      const params = new URLSearchParams(searchParams.toString());
      params.delete('tab'); // 기존 호환 파라미터 정리
      params.delete('status');
      if (newView === 'outbound') {
        params.delete('view');
      } else {
        params.set('view', newView);
      }
      const queryString = params.toString();
      router.push(
        queryString
          ? `${FRONTEND_ROUTES.CHECKOUTS.LIST}?${queryString}`
          : FRONTEND_ROUTES.CHECKOUTS.LIST,
        { scroll: false }
      );
    },
    [router, searchParams]
  );

  /** 통계 카드 클릭 시 상태 필터 적용 */
  const handleStatCardClick = useCallback(
    (status: string) => {
      if (statusFilter === status) {
        // 이미 같은 필터면 해제
        setStatusFilter('all');
      } else {
        setStatusFilter(status);
      }
    },
    [statusFilter]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
  };

  const handleLocationChange = (value: string) => {
    setLocationFilter(value);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setLocationFilter('all');
  };

  // ──────────────────────────────────────────────
  // Render helpers
  // ──────────────────────────────────────────────

  const renderEmptyState = (message?: string) => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <ClipboardList className="h-12 w-12 text-gray-400 mb-4" aria-hidden="true" />
      <h3 className="text-lg font-medium text-gray-900">
        {message || (isInbound ? '반입 정보가 없습니다' : '반출 정보가 없습니다')}
      </h3>
      <p className="text-sm text-gray-500 mt-2 mb-4">검색 조건에 맞는 정보가 없습니다.</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={resetFilters}>
          필터 초기화
        </Button>
        {!isInbound && (
          <Button onClick={() => router.push(FRONTEND_ROUTES.CHECKOUTS.CREATE)}>
            <Plus className="mr-2 h-4 w-4" />
            반출 신청하기
          </Button>
        )}
      </div>
    </div>
  );

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

  // ──────────────────────────────────────────────
  // 통계 카드 (반출 탭)
  // ──────────────────────────────────────────────

  const renderOutboundStats = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card
        className={`cursor-pointer transition-colors hover:border-primary/50 ${statusFilter === 'all' && locationFilter === 'all' && !searchTerm ? 'border-primary bg-primary/5' : ''}`}
        onClick={() => {
          setStatusFilter('all');
          setLocationFilter('all');
          setSearchTerm('');
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
        onClick={() => handleStatCardClick('pending')}
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
        onClick={() => handleStatCardClick('overdue')}
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
          handleStatCardClick(
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
  // 렌탈 반입 테이블
  // ──────────────────────────────────────────────

  const renderRentalImportsList = () => {
    if (rentalImportsLoading) return renderLoadingState();
    if (!rentalImportsData?.items?.length) return null;

    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">외부 업체 렌탈</h3>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>장비명</TableHead>
                <TableHead>분류</TableHead>
                <TableHead>렌탈 업체</TableHead>
                <TableHead>사용 기간</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>신청일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rentalImportsData.items.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(FRONTEND_ROUTES.RENTAL_IMPORTS.DETAIL(item.id))}
                >
                  <TableCell className="font-medium line-clamp-1">{item.equipmentName}</TableCell>
                  <TableCell>
                    {CLASSIFICATION_LABELS[item.classification as Classification] ||
                      item.classification}
                  </TableCell>
                  <TableCell className="line-clamp-1">{item.vendorName}</TableCell>
                  <TableCell className="tabular-nums">
                    {format(new Date(item.usagePeriodStart), 'yy.MM.dd', { locale: ko })}
                    {' ~ '}
                    {format(new Date(item.usagePeriodEnd), 'yy.MM.dd', { locale: ko })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <RentalImportStatusBadge status={item.status as RentalImportStatus} />
                      {item.status === 'approved' && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-amber-50 text-amber-700 border-amber-300"
                        >
                          수령확인 필요
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {format(new Date(item.createdAt), 'yy.MM.dd', { locale: ko })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  };

  // ──────────────────────────────────────────────
  // 필터 영역에서 사용할 상태 옵션
  // ──────────────────────────────────────────────

  const renderStatusFilterOptions = () => {
    if (isInbound) {
      // 반입 탭: checkout + rental 상태 통합 (rental 상태 기본 사용)
      return RENTAL_IMPORT_STATUS_VALUES.map((status) => (
        <SelectItem key={status} value={status}>
          {RENTAL_IMPORT_STATUS_LABELS[status as RentalImportStatus]}
        </SelectItem>
      ));
    }
    return CHECKOUT_STATUS_FILTER_OPTIONS.map((status) => (
      <SelectItem key={status} value={status}>
        {CHECKOUT_STATUS_LABELS[status]}
      </SelectItem>
    ));
  };

  // ──────────────────────────────────────────────
  // 반입 탭 목록 렌더링
  // ──────────────────────────────────────────────

  const renderInboundContent = () => {
    const hasInboundCheckouts = inboundGroups.length > 0;
    const hasRentalImports = rentalImportsData?.items && rentalImportsData.items.length > 0;
    const isLoading = inboundCheckoutsLoading || rentalImportsLoading;

    if (isLoading) return renderLoadingState();

    if (!hasInboundCheckouts && !hasRentalImports) {
      return renderEmptyState('반입 정보가 없습니다');
    }

    return (
      <div className="space-y-6">
        {/* 타팀 장비 대여 건 */}
        {hasInboundCheckouts && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">타팀 장비 대여</h3>
            {inboundGroups.map((group) => (
              <CheckoutGroupCard
                key={group.key}
                group={group}
                onCheckoutClick={(id) => router.push(FRONTEND_ROUTES.CHECKOUTS.DETAIL(id))}
              />
            ))}
          </div>
        )}

        {/* 외부 업체 렌탈 */}
        {renderRentalImportsList()}
      </div>
    );
  };

  // ──────────────────────────────────────────────
  // Main render
  // ──────────────────────────────────────────────

  return (
    <div className="container mx-auto py-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">반출입 관리</h1>
          <p className="text-muted-foreground">장비 반출입 요청 및 현황을 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push(FRONTEND_ROUTES.CHECKOUTS.CREATE)}>
            <Plus className="mr-2 h-4 w-4" /> 반출 신청
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(FRONTEND_ROUTES.RENTAL_IMPORTS.CREATE)}
          >
            <PackagePlus className="mr-2 h-4 w-4" /> 반입 신청
          </Button>
        </div>
      </div>

      {/* 통계 카드 — 반출 탭에서만 표시 */}
      {!isInbound && renderOutboundStats()}

      {/* 탭과 필터 */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <Tabs value={currentView} className="w-full" onValueChange={handleViewChange}>
          <TabsList>
            <TabsTrigger value="outbound" className="gap-1.5">
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              반출
            </TabsTrigger>
            <TabsTrigger value="inbound" className="gap-1.5">
              <ArrowDownLeft className="h-3.5 w-3.5" aria-hidden="true" />
              반입
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search
              className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500"
              aria-hidden="true"
            />
            <Input
              placeholder={isInbound ? '장비명 또는 업체명 검색' : '장비 또는 사용자 검색'}
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-8"
              aria-label="검색"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[140px]" aria-label="상태 필터">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>상태</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {renderStatusFilterOptions()}
            </SelectContent>
          </Select>
          {/* 반출지 필터 — 반출 탭에서만 표시 */}
          {!isInbound && (
            <Select value={locationFilter} onValueChange={handleLocationChange}>
              <SelectTrigger className="w-[140px]" aria-label="반출지 필터">
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>반출지</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {destinations?.map((dest) => (
                  <SelectItem key={dest} value={dest}>
                    {dest}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* 목록 렌더링 */}
      <div className="space-y-3">
        {isInbound
          ? renderInboundContent()
          : checkoutsLoading
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
    </div>
  );
}
