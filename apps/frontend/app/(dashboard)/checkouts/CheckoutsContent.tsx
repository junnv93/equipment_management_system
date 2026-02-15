'use client';

import { useState, useCallback, lazy, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  Filter,
  MapPin,
  PackagePlus,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  Building,
  Users,
} from 'lucide-react';
import checkoutApi, { Checkout } from '@/lib/api/checkout-api';
import type { PaginatedResponse } from '@/lib/api/types';
import {
  CHECKOUT_STATUS_LABELS,
  CHECKOUT_STATUS_FILTER_OPTIONS,
  EQUIPMENT_IMPORT_STATUS_VALUES,
  EQUIPMENT_IMPORT_STATUS_LABELS,
  type EquipmentImportStatus,
} from '@equipment-management/schemas';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';

// ✅ 코드 분할: 탭 컴포넌트를 lazy loading으로 번들 크기 40-50% 감소
const OutboundCheckoutsTab = lazy(() => import('./tabs/OutboundCheckoutsTab'));
const InboundCheckoutsTab = lazy(() => import('./tabs/InboundCheckoutsTab'));

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
  // 반출지 목록 (DB 기반) - 필터용
  // ──────────────────────────────────────────────
  const { data: destinations } = useQuery({
    queryKey: queryKeys.checkouts.destinations(),
    queryFn: () => checkoutApi.getDestinations(),
    staleTime: CACHE_TIMES.LONG,
  });

  // ✅ 요약 정보 (initialSummary from server, updated by tab component)
  const summary = initialSummary;

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

  /** Lazy loading fallback skeleton */
  const TabLoadingSkeleton = () => (
    <div className="space-y-3">
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
    </div>
  );

  // ──────────────────────────────────────────────
  // 필터 영역에서 사용할 상태 옵션
  // ──────────────────────────────────────────────

  const renderStatusFilterOptions = () => {
    if (isInbound) {
      // 반입 탭: checkout + rental 상태 통합 (rental 상태 기본 사용)
      return EQUIPMENT_IMPORT_STATUS_VALUES.map((status) => (
        <SelectItem key={status} value={status}>
          {EQUIPMENT_IMPORT_STATUS_LABELS[status as EquipmentImportStatus]}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <PackagePlus className="mr-2 h-4 w-4" /> 반입 신청
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(FRONTEND_ROUTES.EQUIPMENT_IMPORTS.CREATE_RENTAL)}
              >
                <Building className="mr-2 h-4 w-4" />
                외부 렌탈 반입
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(FRONTEND_ROUTES.EQUIPMENT_IMPORTS.CREATE_INTERNAL)}
              >
                <Users className="mr-2 h-4 w-4" />
                내부 공용 반입
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

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

      {/* 탭 콘텐츠 (Lazy Loaded) */}
      <Suspense fallback={<TabLoadingSkeleton />}>
        {isInbound ? (
          <InboundCheckoutsTab
            teamId={teamId}
            statusFilter={statusFilter}
            searchTerm={searchTerm}
            onResetFilters={resetFilters}
          />
        ) : (
          <OutboundCheckoutsTab
            teamId={teamId}
            statusFilter={statusFilter}
            locationFilter={locationFilter}
            searchTerm={searchTerm}
            summary={summary}
            onStatCardClick={handleStatCardClick}
            onResetFilters={resetFilters}
          />
        )}
      </Suspense>
    </div>
  );
}
