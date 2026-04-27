'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  CalendarDays,
  ClipboardList,
  X,
} from 'lucide-react';
import Link from 'next/link';
import checkoutApi, { type CheckoutSummary } from '@/lib/api/checkout-api';
import {
  CHECKOUT_STATUS_FILTER_OPTIONS,
  CHECKOUT_PURPOSE_VALUES,
  EQUIPMENT_IMPORT_STATUS_VALUES,
  USER_SELECTABLE_CHECKOUT_PURPOSES,
  type CheckoutPurpose,
} from '@equipment-management/schemas';
import { FRONTEND_ROUTES, Permission } from '@equipment-management/shared-constants';
import { useAuth } from '@/hooks/use-auth';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import {
  parseCheckoutFiltersFromSearchParams,
  filtersToSearchParams,
  DEFAULT_UI_FILTERS,
  countActiveFilters,
  getStatusFilterDisplayKey,
  getSubTabForStatus,
  type UICheckoutFilters,
  type CheckoutPeriod,
} from '@/lib/utils/checkout-filter-utils';
import {
  CHECKOUT_PURPOSE_LEGEND_TOKENS,
  CHECKOUT_FILTER_BAR_TOKENS,
  CHECKOUT_TAB_BADGE_TOKENS,
  getPageContainerClasses,
  SECTION_RHYTHM_TOKENS,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/shared/PageHeader';
import CheckoutAlertBanners from '@/components/checkouts/CheckoutAlertBanners';
import { CheckoutListSkeleton } from '@/components/checkouts/CheckoutListSkeleton';
import { HeroKPIError } from '@/components/checkouts/HeroKPIError';

// ✅ 코드 분할 (Next.js dynamic import)
const OutboundCheckoutsTab = dynamic(() => import('./tabs/OutboundCheckoutsTab'), {
  ssr: false,
  loading: () => <CheckoutListSkeleton />,
});
const InboundCheckoutsTab = dynamic(() => import('./tabs/InboundCheckoutsTab'), {
  ssr: false,
  loading: () => <CheckoutListSkeleton />,
});

// 기간 프리셋 옵션
const PERIOD_OPTIONS: CheckoutPeriod[] = ['this_week', 'this_month', 'last_month'];

interface CheckoutsContentProps {
  initialSummary: CheckoutSummary;
  initialFilters: UICheckoutFilters;
}

/**
 * 반출입 관리 Client Component (v2 리디자인)
 *
 * 주요 변경:
 * - Alert-First 배너 (기한 초과 / 반입 승인 대기)
 * - 기간 필터 추가
 * - 목적 색상 범례 바 (반출 탭)
 * - 활성 필터 배지 표시
 */
export default function CheckoutsContent({
  initialSummary,
  initialFilters,
}: CheckoutsContentProps) {
  const t = useTranslations('checkouts');
  const tEquipment = useTranslations('equipment');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, can } = useAuth();
  const teamId = session?.user?.teamId;
  const canCreateCheckout = can(Permission.CREATE_CHECKOUT);
  const canCreateImport = can(Permission.CREATE_EQUIPMENT_IMPORT);

  const filters = parseCheckoutFiltersFromSearchParams(searchParams);
  const isInbound = filters.view === 'inbound';

  // 렌더 중 직접 업데이트 — effect가 실행될 때 항상 최신 filters를 참조하기 위함
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const [searchInput, setSearchInput] = useState(initialFilters.search);

  // URL의 search가 외부에서 변경될 때(예: 필터 초기화) 입력값 동기화
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  // 검색어 디바운스 300ms — useDebouncedValue로 stale closure 위험 제거
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    if (debouncedSearch === filtersRef.current.search) return;
    const newFilters = { ...filtersRef.current, search: debouncedSearch, page: 1 };
    const params = filtersToSearchParams(newFilters);
    const qs = params.toString();
    router.replace(
      qs ? `${FRONTEND_ROUTES.CHECKOUTS.LIST}?${qs}` : FRONTEND_ROUTES.CHECKOUTS.LIST,
      { scroll: false }
    );
  }, [debouncedSearch, router]);

  // 확인 필요 건수 — pageSize: 1로 최소 데이터만 fetch (count만 필요)
  // ⚠️ pendingCount 전용 키 사용: pending 전체 목록(PendingChecksClient)과 캐시 충돌 방지
  // pending()과 동일 키 사용 시 pageSize:1 결과가 전체 목록 캐시를 오염시켜 1건만 표시되는 버그 발생
  const { data: pendingChecksData } = useQuery({
    queryKey: queryKeys.checkouts.resource.pendingCount(),
    queryFn: () => checkoutApi.getPendingChecks({ pageSize: 1 }),
    ...QUERY_CONFIG.CHECKOUT_SUMMARY,
  });
  const pendingChecksCount = pendingChecksData?.meta?.pagination?.total ?? 0;

  // 반출지 목록
  const { data: destinations } = useQuery({
    queryKey: queryKeys.checkouts.resource.destinations(),
    queryFn: () => checkoutApi.getDestinations(),
    ...QUERY_CONFIG.CHECKOUT_DESTINATIONS,
  });

  // 통계 요약
  const {
    data: liveSummary,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: queryKeys.checkouts.resource.summary({ direction: 'outbound', teamId }),
    queryFn: async (): Promise<CheckoutSummary> => {
      const result = await checkoutApi.getCheckouts({
        direction: 'outbound',
        teamId,
        pageSize: 1,
        includeSummary: true,
      });
      return result.meta.summary ?? initialSummary;
    },
    ...QUERY_CONFIG.CHECKOUT_SUMMARY,
    placeholderData: initialSummary,
  });

  const summary = liveSummary ?? initialSummary;

  // URL 업데이트 헬퍼
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

  // 핸들러
  const handleViewChange = useCallback(
    (value: string) => {
      const newFilters = { ...DEFAULT_UI_FILTERS, view: value as 'outbound' | 'inbound' };
      setSearchInput('');
      updateUrl(newFilters);
    },
    [updateUrl]
  );

  const handleStatCardClick = useCallback(
    (status: string) => {
      const newStatus = filters.status === status ? 'all' : status;
      // status → subTab 자동 추론: 명확한 귀속이 있으면 전환, 혼합(null)이면 현재 유지
      const inferredSubTab = getSubTabForStatus(newStatus);
      updateUrl({
        ...filters,
        status: newStatus,
        subTab: inferredSubTab ?? filters.subTab,
        page: 1,
      });
    },
    [filters, updateUrl]
  );

  const handleStatusChange = (value: string) => {
    if (value === filters.status) return;
    const inferredSubTab = getSubTabForStatus(value);
    updateUrl({ ...filters, status: value, subTab: inferredSubTab ?? filters.subTab, page: 1 });
  };
  const handleLocationChange = (value: string) => {
    if (value === filters.destination) return;
    updateUrl({ ...filters, destination: value, page: 1 });
  };
  const handlePurposeChange = (value: string) => {
    if (value === filters.purpose) return;
    const purpose: CheckoutPurpose | 'all' =
      value === 'all' || (CHECKOUT_PURPOSE_VALUES as ReadonlyArray<string>).includes(value)
        ? (value as CheckoutPurpose | 'all')
        : 'all';
    updateUrl({ ...filters, purpose, page: 1 });
  };
  const handlePeriodChange = (value: string) => {
    if (value === filters.period) return;
    updateUrl({ ...filters, period: value as CheckoutPeriod, page: 1 });
  };

  const resetFilters = useCallback(() => {
    setSearchInput('');
    updateUrl({ ...DEFAULT_UI_FILTERS, view: filters.view });
  }, [filters.view, updateUrl]);

  const activeFilterCount = countActiveFilters(filters);

  const renderStatusFilterOptions = () => {
    if (isInbound) {
      return EQUIPMENT_IMPORT_STATUS_VALUES.map((status) => (
        <SelectItem key={status} value={status}>
          {tEquipment(`importStatus.${status}`)}
        </SelectItem>
      ));
    }
    return CHECKOUT_STATUS_FILTER_OPTIONS.map((status) => (
      <SelectItem key={status} value={status}>
        {t(`status.${status}`)}
      </SelectItem>
    ));
  };

  return (
    <div className={getPageContainerClasses('list', SECTION_RHYTHM_TOKENS.spacious)}>
      {/* ── 헤더 ── */}
      <PageHeader
        title={t('title')}
        subtitle={t('description')}
        onboardingHint={{
          id: 'checkouts-first-visit',
          title: t('onboarding.title'),
          description: t('onboarding.description'),
          canShowPrimaryAction: canCreateCheckout,
          primaryAction: {
            label: t('onboarding.cta'),
            href: FRONTEND_ROUTES.CHECKOUTS.CREATE,
          },
        }}
        actions={
          <div className="flex gap-2">
            {pendingChecksCount > 0 && (
              <Button size="sm" variant="outline" asChild>
                <Link href={FRONTEND_ROUTES.CHECKOUTS.PENDING_CHECKS}>
                  <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
                  {t('pendingChecks.title')}
                  <span
                    className={cn(
                      CHECKOUT_TAB_BADGE_TOKENS.base,
                      CHECKOUT_TAB_BADGE_TOKENS.alert,
                      'ml-1.5 inline-flex items-center justify-center'
                    )}
                  >
                    {pendingChecksCount}
                  </span>
                </Link>
              </Button>
            )}
            {canCreateCheckout && (
              <Button size="sm" onClick={() => router.push(FRONTEND_ROUTES.CHECKOUTS.CREATE)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {t('actions.create')}
              </Button>
            )}
            {canCreateImport && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <PackagePlus className="mr-1.5 h-3.5 w-3.5" />
                    {t('import.requestInbound')}
                    <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
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
            )}
          </div>
        }
      />

      {/* ── 탭 (Alert·필터바·콘텐츠 전체 포함 — WCAG TabsContent 시맨틱) ── */}
      <Tabs value={filters.view} className="w-full" onValueChange={handleViewChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="outbound" className="gap-1.5">
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            {t('tabs.outbound')}
            {summary.total > 0 && (
              <span
                className={`${CHECKOUT_TAB_BADGE_TOKENS.base} ${
                  filters.view === 'outbound'
                    ? CHECKOUT_TAB_BADGE_TOKENS.active
                    : CHECKOUT_TAB_BADGE_TOKENS.inactive
                }`}
              >
                {summary.total}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="inbound" className="gap-1.5">
            <ArrowDownLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {t('tabs.inbound')}
          </TabsTrigger>
        </TabsList>

        {/* ── Alert-First 배너 (반출 탭만) ── */}
        {!isInbound && <CheckoutAlertBanners summary={summary} />}

        {/* ── 필터 바 ── */}
        <div className={`${CHECKOUT_FILTER_BAR_TOKENS.container} mb-3`}>
          {/* 검색 */}
          <div className="relative flex-1 min-w-[180px]">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              placeholder={
                isInbound ? t('inbound.searchPlaceholder') : t('outbound.searchPlaceholder')
              }
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8 h-8 text-sm"
              aria-label={t('filters.searchLabel')}
            />
          </div>

          {/* 구분선 */}
          <div className={CHECKOUT_FILTER_BAR_TOKENS.divider} aria-hidden="true" />

          {/* 상태 필터 */}
          <Select value={filters.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-8 w-[120px] text-xs" aria-label={t('filters.statusFilter')}>
              <div className="flex items-center gap-1.5">
                <Filter className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
                <SelectValue placeholder={t('filters.statusLabel')} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.statusAll')}</SelectItem>
              {renderStatusFilterOptions()}
            </SelectContent>
          </Select>

          {/* 목적 필터 */}
          {!isInbound && (
            <Select value={filters.purpose} onValueChange={handlePurposeChange}>
              <SelectTrigger
                className="h-8 w-[100px] text-xs"
                aria-label={t('filters.purposeFilter')}
              >
                <div className="flex items-center gap-1.5">
                  <Tag className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <SelectValue placeholder={t('filters.purposeLabel')} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.all')}</SelectItem>
                {USER_SELECTABLE_CHECKOUT_PURPOSES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {t(`purpose.${p}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* 반출지 필터 */}
          {!isInbound && (
            <Select value={filters.destination} onValueChange={handleLocationChange}>
              <SelectTrigger
                className="h-8 w-[120px] text-xs"
                aria-label={t('filters.destinationFilter')}
              >
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <SelectValue placeholder={t('filters.destinationLabel')} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.all')}</SelectItem>
                {destinations?.map((dest) => (
                  <SelectItem key={dest} value={dest}>
                    {dest}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* 기간 필터 */}
          {!isInbound && (
            <>
              <div className={CHECKOUT_FILTER_BAR_TOKENS.divider} aria-hidden="true" />
              <Select value={filters.period} onValueChange={handlePeriodChange}>
                <SelectTrigger
                  className="h-8 w-[110px] text-xs"
                  aria-label={t('filters.periodFilter')}
                >
                  <div className="flex items-center gap-1.5">
                    <CalendarDays
                      className="h-3 w-3 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <SelectValue placeholder={t('filters.periodLabel')} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.periodAll')}</SelectItem>
                  {PERIOD_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {t(`filters.period_${p}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          {/* 활성 필터 태그 (개별 값 표시) */}
          {activeFilterCount > 0 && (
            <>
              <div className={CHECKOUT_FILTER_BAR_TOKENS.divider} aria-hidden="true" />
              {filters.status !== 'all' && (
                <button
                  type="button"
                  className={CHECKOUT_FILTER_BAR_TOKENS.tag}
                  onClick={() => updateUrl({ ...filters, status: 'all', page: 1 })}
                >
                  {t(getStatusFilterDisplayKey(filters.status))}
                  <X className={CHECKOUT_FILTER_BAR_TOKENS.tagDismissIcon} />
                </button>
              )}
              {filters.destination !== 'all' && (
                <button
                  type="button"
                  className={CHECKOUT_FILTER_BAR_TOKENS.tag}
                  onClick={() => updateUrl({ ...filters, destination: 'all', page: 1 })}
                >
                  {filters.destination}
                  <X className={CHECKOUT_FILTER_BAR_TOKENS.tagDismissIcon} />
                </button>
              )}
              {filters.purpose !== 'all' && (
                <button
                  type="button"
                  className={CHECKOUT_FILTER_BAR_TOKENS.tag}
                  onClick={() => updateUrl({ ...filters, purpose: 'all', page: 1 })}
                >
                  {t(`purpose.${filters.purpose}`)}
                  <X className={CHECKOUT_FILTER_BAR_TOKENS.tagDismissIcon} />
                </button>
              )}
              {filters.period !== 'all' && (
                <button
                  type="button"
                  className={CHECKOUT_FILTER_BAR_TOKENS.tag}
                  onClick={() => updateUrl({ ...filters, period: 'all', page: 1 })}
                >
                  {t(`filters.period_${filters.period}`)}
                  <X className={CHECKOUT_FILTER_BAR_TOKENS.tagDismissIcon} />
                </button>
              )}
              {filters.search && (
                <button
                  type="button"
                  className={CHECKOUT_FILTER_BAR_TOKENS.tag}
                  onClick={() => {
                    setSearchInput('');
                    updateUrl({ ...filters, search: '', page: 1 });
                  }}
                >
                  &ldquo;{filters.search}&rdquo;
                  <X className={CHECKOUT_FILTER_BAR_TOKENS.tagDismissIcon} />
                </button>
              )}
              <button
                type="button"
                className={CHECKOUT_FILTER_BAR_TOKENS.resetButton}
                onClick={resetFilters}
              >
                <X className={CHECKOUT_FILTER_BAR_TOKENS.resetIcon} />
                {t('actions.resetFilters')}
              </button>
            </>
          )}
        </div>

        {/* ── 목적 색상 범례 (반출 탭만) ── */}
        {!isInbound && (
          <div className={`${CHECKOUT_PURPOSE_LEGEND_TOKENS.container} mb-4`}>
            <span className={CHECKOUT_PURPOSE_LEGEND_TOKENS.label}>{t('legend.label')}</span>
            <span className={CHECKOUT_PURPOSE_LEGEND_TOKENS.item}>
              <span className={CHECKOUT_PURPOSE_LEGEND_TOKENS.dot.calibration} />
              {t('legend.calibration')}
            </span>
            <span className={CHECKOUT_PURPOSE_LEGEND_TOKENS.item}>
              <span className={CHECKOUT_PURPOSE_LEGEND_TOKENS.dot.repair} />
              {t('legend.repair')}
            </span>
            <span className={CHECKOUT_PURPOSE_LEGEND_TOKENS.item}>
              <span className={CHECKOUT_PURPOSE_LEGEND_TOKENS.dot.rental} />
              {t('legend.rental')}
            </span>
          </div>
        )}

        {/* ── 탭 패널 (WCAG: role="tabpanel" + aria-labelledby) ── */}
        <TabsContent value="outbound" className="mt-0">
          {/* summary 쿼리 에러 시 KPI 영역 독립 에러 — 목록은 탭 내부에서 별도 처리 */}
          {isSummaryError && <HeroKPIError onRetry={() => void refetchSummary()} />}
          <Suspense fallback={<CheckoutListSkeleton />}>
            <OutboundCheckoutsTab
              teamId={teamId}
              filters={filters}
              summary={summary}
              onStatCardClick={handleStatCardClick}
              onResetFilters={resetFilters}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="inbound" className="mt-0">
          <Suspense fallback={<CheckoutListSkeleton />}>
            <InboundCheckoutsTab teamId={teamId} filters={filters} onResetFilters={resetFilters} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
