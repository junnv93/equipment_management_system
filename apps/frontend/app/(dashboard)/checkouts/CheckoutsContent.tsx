'use client';

import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Tag,
} from 'lucide-react';
import checkoutApi, { type CheckoutSummary } from '@/lib/api/checkout-api';
import {
  CHECKOUT_STATUS_FILTER_OPTIONS,
  EQUIPMENT_IMPORT_STATUS_VALUES,
  EQUIPMENT_IMPORT_STATUS_LABELS,
  type EquipmentImportStatus,
} from '@equipment-management/schemas';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import {
  parseCheckoutFiltersFromSearchParams,
  filtersToSearchParams,
  DEFAULT_UI_FILTERS,
  type UICheckoutFilters,
} from '@/lib/utils/checkout-filter-utils';

// ✅ 코드 분할: 탭 컴포넌트를 lazy loading으로 번들 크기 40-50% 감소
const OutboundCheckoutsTab = lazy(() => import('./tabs/OutboundCheckoutsTab'));
const InboundCheckoutsTab = lazy(() => import('./tabs/InboundCheckoutsTab'));

/** Lazy loading fallback skeleton */
function TabLoadingSkeleton() {
  return (
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
}

// ============================================================================
// Types
// ============================================================================

interface CheckoutsContentProps {
  /** 서버에서 가져온 초기 요약 정보 (placeholderData로 사용) */
  initialSummary: CheckoutSummary;
  /** 서버에서 파싱한 초기 필터 */
  initialFilters: UICheckoutFilters;
}

// 반출 목적 필터 옵션
const PURPOSE_OPTIONS = ['calibration', 'repair', 'rental'] as const;

// ============================================================================
// Component
// ============================================================================

/**
 * 반출입 관리 Client Component
 *
 * 2탭 구조:
 * - [반출] 우리 팀 장비가 나가는 건 (교정/수리 + 타팀이 우리 장비를 빌려감)
 * - [반입] 외부 장비가 들어오는 건 (타팀 장비 대여 + 외부 업체 렌탈)
 *
 * URL SSOT: 모든 필터 상태는 URL 파라미터가 진실의 소스
 * - 검색어는 로컬 state에서 300ms 디바운스 후 URL 반영
 */
export default function CheckoutsContent({
  initialSummary,
  initialFilters,
}: CheckoutsContentProps) {
  const t = useTranslations('checkouts');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const teamId = session?.user?.teamId;

  // URL에서 현재 필터 파싱 (URL이 SSOT)
  const filters = parseCheckoutFiltersFromSearchParams(searchParams);
  const isInbound = filters.view === 'inbound';

  // 검색어는 로컬 state (입력 중 UX) → 디바운스 후 URL 반영
  const [searchInput, setSearchInput] = useState(initialFilters.search);

  // URL의 search가 변경되면 로컬 input도 동기화 (탭 전환 등)
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  // 검색어 디바운스: 300ms 후 URL 반영
  useEffect(() => {
    if (searchInput === filters.search) return;
    const timer = setTimeout(() => {
      const newFilters = { ...filters, search: searchInput, page: 1 };
      const params = filtersToSearchParams(newFilters);
      const qs = params.toString();
      router.replace(
        qs ? `${FRONTEND_ROUTES.CHECKOUTS.LIST}?${qs}` : FRONTEND_ROUTES.CHECKOUTS.LIST,
        { scroll: false }
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  // ──────────────────────────────────────────────
  // 반출지 목록 (DB 기반) - 필터용
  // ──────────────────────────────────────────────
  const { data: destinations } = useQuery({
    queryKey: queryKeys.checkouts.destinations(),
    queryFn: () => checkoutApi.getDestinations(),
    staleTime: CACHE_TIMES.LONG,
  });

  // ──────────────────────────────────────────────
  // 통계 카드 요약 (필터 독립적, 글로벌 집계)
  // initialSummary는 SSR 초기값(placeholderData), 이후 자동 갱신
  // ──────────────────────────────────────────────
  const { data: liveSummary } = useQuery({
    queryKey: queryKeys.checkouts.summary({ direction: 'outbound', teamId }),
    queryFn: async (): Promise<CheckoutSummary> => {
      const result = await checkoutApi.getCheckouts({
        direction: 'outbound',
        teamId,
        pageSize: 1,
        includeSummary: true,
      });
      return result.meta.summary ?? initialSummary;
    },
    placeholderData: initialSummary,
    staleTime: CACHE_TIMES.SHORT,
  });

  const summary = liveSummary ?? initialSummary;

  // ──────────────────────────────────────────────
  // URL 업데이트 헬퍼
  // ──────────────────────────────────────────────
  const updateUrl = useCallback(
    (newFilters: UICheckoutFilters) => {
      const params = filtersToSearchParams(newFilters);
      const qs = params.toString();
      router.replace(
        qs ? `${FRONTEND_ROUTES.CHECKOUTS.LIST}?${qs}` : FRONTEND_ROUTES.CHECKOUTS.LIST,
        { scroll: false }
      );
    },
    [router]
  );

  // ──────────────────────────────────────────────
  // 핸들러
  // ──────────────────────────────────────────────

  const handleViewChange = useCallback(
    (value: string) => {
      // 탭 전환 시 필터 초기화
      const newFilters = { ...DEFAULT_UI_FILTERS, view: value as 'outbound' | 'inbound' };
      setSearchInput('');
      updateUrl(newFilters);
    },
    [updateUrl]
  );

  /** 통계 카드 클릭 시 상태 필터 토글 */
  const handleStatCardClick = useCallback(
    (status: string) => {
      const newStatus = filters.status === status ? 'all' : status;
      updateUrl({ ...filters, status: newStatus, page: 1 });
    },
    [filters, updateUrl]
  );

  const handleStatusChange = (value: string) => {
    updateUrl({ ...filters, status: value, page: 1 });
  };

  const handleLocationChange = (value: string) => {
    updateUrl({ ...filters, destination: value, page: 1 });
  };

  const handlePurposeChange = (value: string) => {
    updateUrl({ ...filters, purpose: value, page: 1 });
  };

  const resetFilters = useCallback(() => {
    setSearchInput('');
    updateUrl({ ...DEFAULT_UI_FILTERS, view: filters.view });
  }, [filters.view, updateUrl]);

  // ──────────────────────────────────────────────
  // Render helpers
  // ──────────────────────────────────────────────

  const renderStatusFilterOptions = () => {
    if (isInbound) {
      return EQUIPMENT_IMPORT_STATUS_VALUES.map((status) => (
        <SelectItem key={status} value={status}>
          {EQUIPMENT_IMPORT_STATUS_LABELS[status as EquipmentImportStatus]}
        </SelectItem>
      ));
    }
    return CHECKOUT_STATUS_FILTER_OPTIONS.map((status) => (
      <SelectItem key={status} value={status}>
        {t(`status.${status}`)}
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
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push(FRONTEND_ROUTES.CHECKOUTS.CREATE)}>
            <Plus className="mr-2 h-4 w-4" /> {t('actions.create')}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <PackagePlus className="mr-2 h-4 w-4" /> {t('import.requestInbound')}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(FRONTEND_ROUTES.EQUIPMENT_IMPORTS.CREATE_RENTAL)}
              >
                <Building className="mr-2 h-4 w-4" />
                {t('import.externalRental')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(FRONTEND_ROUTES.EQUIPMENT_IMPORTS.CREATE_INTERNAL)}
              >
                <Users className="mr-2 h-4 w-4" />
                {t('import.internalShared')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 탭과 필터 */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <Tabs value={filters.view} className="w-full" onValueChange={handleViewChange}>
          <TabsList>
            <TabsTrigger value="outbound" className="gap-1.5">
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              {t('tabs.outbound')}
            </TabsTrigger>
            <TabsTrigger value="inbound" className="gap-1.5">
              <ArrowDownLeft className="h-3.5 w-3.5" aria-hidden="true" />
              {t('tabs.inbound')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* 검색 */}
          <div className="relative w-full sm:w-56">
            <Search
              className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              placeholder={
                isInbound ? t('inbound.searchPlaceholder') : t('outbound.searchPlaceholder')
              }
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8"
              aria-label={t('filters.searchLabel')}
            />
          </div>
          {/* 상태 필터 */}
          <Select value={filters.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[130px]" aria-label={t('filters.statusFilter')}>
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
                <SelectValue placeholder={t('filters.statusLabel')} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.statusAll')}</SelectItem>
              {renderStatusFilterOptions()}
            </SelectContent>
          </Select>
          {/* 반출지 필터 — 반출 탭에서만 표시 */}
          {!isInbound && (
            <Select value={filters.destination} onValueChange={handleLocationChange}>
              <SelectTrigger className="w-[130px]" aria-label={t('filters.destinationFilter')}>
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
                  <SelectValue placeholder={t('filters.destinationLabel')} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.statusAll')}</SelectItem>
                {destinations?.map((dest) => (
                  <SelectItem key={dest} value={dest}>
                    {dest}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {/* 목적 필터 — 반출 탭에서만 표시 */}
          {!isInbound && (
            <Select value={filters.purpose} onValueChange={handlePurposeChange}>
              <SelectTrigger className="w-[120px]" aria-label={t('filters.purposeFilter')}>
                <div className="flex items-center">
                  <Tag className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
                  <SelectValue placeholder={t('filters.purposeLabel')} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.statusAll')}</SelectItem>
                {PURPOSE_OPTIONS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {t(`purpose.${p}`)}
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
          <InboundCheckoutsTab teamId={teamId} filters={filters} onResetFilters={resetFilters} />
        ) : (
          <OutboundCheckoutsTab
            teamId={teamId}
            filters={filters}
            summary={summary}
            onStatCardClick={handleStatCardClick}
            onResetFilters={resetFilters}
          />
        )}
      </Suspense>
    </div>
  );
}
