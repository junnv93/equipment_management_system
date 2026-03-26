'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { differenceInDays } from 'date-fns';
import {
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  FileWarning,
  Eye,
  CheckCircle2,
  XCircle,
  Download,
} from 'lucide-react';
import nonConformancesApi, { type NonConformance } from '@/lib/api/non-conformances-api';
import {
  NonConformanceStatusValues as NCStatusVal,
  NonConformanceTypeValues,
  SITE_VALUES,
} from '@equipment-management/schemas';
import type { PaginatedResponse } from '@/lib/api/types';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { useNCFilters } from '@/hooks/use-nc-filters';
import type { UINonConformancesFilters } from '@/lib/utils/non-conformances-filter-utils';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import {
  getSemanticBadgeClasses,
  ncStatusToSemantic,
  NC_HEADER_TOKENS,
  NC_KPI_TOKENS,
  NC_KPI_CARD_TOKENS,
  getNCKpiCardClasses,
  NC_FILTER_TOKENS,
  NC_LIST_TOKENS,
  NC_TYPE_CHIP_TOKENS,
  NC_MINI_WORKFLOW_TOKENS,
  NC_WORKFLOW_STEPS,
  NC_STATUS_STEP_INDEX,
  getNCMiniDotClasses,
  getNCMiniConnectorClasses,
  getNCElapsedDaysClasses,
  isNCLongOverdue,
  NC_EMPTY_STATE_TOKENS,
  NC_PAGINATION_TOKENS,
  NC_STAGGER_DELAY_MS,
  NC_REJECTION_BADGE_TOKENS,
  type NCKpiVariant,
  getPageContainerClasses,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useFilterSelect } from '@/lib/utils/filter-select-utils';

// ============================================================================
// 상수
// ============================================================================

/** KPI 아이콘 매핑 */
const KPI_ICONS: Record<NCKpiVariant, typeof AlertTriangle> = {
  open: AlertTriangle,
  corrected: CheckCircle2,
  closed: XCircle,
};

// ============================================================================
// Props
// ============================================================================

interface NonConformancesContentProps {
  initialData: PaginatedResponse<NonConformance>;
  initialFilters?: UINonConformancesFilters;
}

// ============================================================================
// Main Component
// ============================================================================

export default function NonConformancesContent({
  initialData,
  initialFilters: _initialFilters,
}: NonConformancesContentProps) {
  const t = useTranslations('non-conformances');

  // ✅ SSOT: URL-driven 필터 (useState 제거)
  const {
    filters,
    apiFilters,
    activeCount,
    updateStatus,
    updateNCType,
    updateSite,
    updateSearch,
    updatePage,
    clearFilters,
  } = useNCFilters();

  // ✅ Radix Select spurious onValueChange 방지 (useFilterSelect SSOT)
  const statusSelect = useFilterSelect(filters.status, updateStatus);
  const ncTypeSelect = useFilterSelect(filters.ncType, updateNCType);
  const siteSelect = useFilterSelect(filters.site, updateSite);

  // ✅ TanStack Query — 서버 초기 데이터를 placeholderData로 사용
  const queryFilters = { ...apiFilters, includeSummary: true };
  const {
    data,
    isLoading: _isLoading,
    isFetching,
  } = useQuery({
    queryKey: queryKeys.nonConformances.list(queryFilters),
    queryFn: () => nonConformancesApi.getNonConformances(queryFilters),
    placeholderData: initialData,
    ...QUERY_CONFIG.NON_CONFORMANCES_LIST,
  });

  const ncList = data?.data ?? [];
  const pagination = data?.meta?.pagination;

  // ✅ 서버 사이드 summary 집계 (status 필터 제외한 전체 건수)
  const serverSummary = data?.meta?.summary;
  const kpiCounts: Record<NCKpiVariant, number> = serverSummary
    ? {
        open: serverSummary.open ?? 0,
        corrected: serverSummary.corrected ?? 0,
        closed: serverSummary.closed ?? 0,
      }
    : computeKpiCounts(ncList);

  /** CSV 내보내기 */
  const handleExport = () => {
    if (ncList.length === 0) return;
    const headers = [
      t('list.csvHeaders.status'),
      t('list.csvHeaders.type'),
      t('list.csvHeaders.equipmentName'),
      t('list.csvHeaders.managementNumber'),
      t('list.csvHeaders.cause'),
      t('list.csvHeaders.discoveryDate'),
      t('list.csvHeaders.elapsedDays'),
    ];
    const rows = ncList.map((nc) => {
      const elapsed = computeElapsedDays(nc);
      return [
        t('ncStatus.' + nc.status),
        t('ncType.' + nc.ncType),
        nc.equipment?.name ?? '',
        nc.equipment?.managementNumber ?? '',
        nc.cause,
        nc.discoveryDate,
        nc.status !== 'closed' ? t('list.csvElapsedDays', { days: elapsed }) : '',
      ];
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = t('list.csvFileName', { date: dateStr });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={getPageContainerClasses('list', 'space-y-5')}>
      {/* 헤더 */}
      <div className={NC_HEADER_TOKENS.container}>
        <div>
          <h1 className={NC_HEADER_TOKENS.title}>{t('title')}</h1>
          <p className={NC_HEADER_TOKENS.subtitle}>{t('subtitle')}</p>
        </div>
        <div className={NC_HEADER_TOKENS.actionsGroup}>
          <Button variant="ghost" size="sm" onClick={handleExport} disabled={ncList.length === 0}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            {t('list.export')}
          </Button>
        </div>
      </div>

      {/* KPI 스트립 */}
      <div className="grid grid-cols-3 gap-3">
        {(Object.keys(KPI_ICONS) as NCKpiVariant[]).map((variant) => {
          const Icon = KPI_ICONS[variant];
          const tokens = NC_KPI_TOKENS[variant];
          const isActive = filters.status === variant;
          return (
            <button
              key={variant}
              type="button"
              className={getNCKpiCardClasses(variant, isActive)}
              onClick={() => updateStatus(isActive ? '' : variant)}
            >
              <div className={cn(NC_KPI_CARD_TOKENS.iconWrap, tokens.iconBg)}>
                <Icon className={cn('h-5 w-5', tokens.iconColor)} />
              </div>
              <div>
                <p className={NC_KPI_CARD_TOKENS.label}>{t('kpi.' + variant)}</p>
                <p className={cn(NC_KPI_CARD_TOKENS.value, tokens.valueColor)}>
                  {kpiCounts[variant]}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* 필터 바 */}
      <div className={NC_FILTER_TOKENS.container}>
        {/* 검색 */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={t('list.searchPlaceholder')}
            value={filters.search}
            onChange={(e) => updateSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>

        <div className={NC_FILTER_TOKENS.divider} />

        {/* 상태 필터 */}
        <Select {...statusSelect}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue placeholder={t('list.filterStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">{t('list.filterStatusAll')}</SelectItem>
            {Object.values(NCStatusVal).map((key) => (
              <SelectItem key={key} value={key}>
                {t('ncStatus.' + key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 유형 필터 */}
        <Select {...ncTypeSelect}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue placeholder={t('list.filterType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">{t('list.filterTypeAll')}</SelectItem>
            {Object.values(NonConformanceTypeValues).map((key) => (
              <SelectItem key={key} value={key}>
                {t('ncType.' + key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 사이트 필터 */}
        <Select {...siteSelect}>
          <SelectTrigger className="h-8 w-[110px] text-xs">
            <SelectValue placeholder={t('list.filterSite')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">{t('list.filterSiteAll')}</SelectItem>
            {SITE_VALUES.map((key) => (
              <SelectItem key={key} value={key}>
                {t('siteLabels.' + key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 활성 필터 태그 */}
        {activeCount > 0 && (
          <>
            <div className={NC_FILTER_TOKENS.divider} />
            {filters.status && (
              <span className={NC_FILTER_TOKENS.tag}>
                {t('ncStatus.' + filters.status)}
                <button type="button" onClick={() => updateStatus('')}>
                  <X className={NC_FILTER_TOKENS.tagDismissIcon} />
                </button>
              </span>
            )}
            {filters.ncType && (
              <span className={NC_FILTER_TOKENS.tag}>
                {t('ncType.' + filters.ncType)}
                <button type="button" onClick={() => updateNCType('')}>
                  <X className={NC_FILTER_TOKENS.tagDismissIcon} />
                </button>
              </span>
            )}
            {filters.site && (
              <span className={NC_FILTER_TOKENS.tag}>
                {t('siteLabels.' + filters.site)}
                <button type="button" onClick={() => updateSite('')}>
                  <X className={NC_FILTER_TOKENS.tagDismissIcon} />
                </button>
              </span>
            )}
            {filters.search && (
              <span className={NC_FILTER_TOKENS.tag}>
                &ldquo;{filters.search}&rdquo;
                <button type="button" onClick={() => updateSearch('')}>
                  <X className={NC_FILTER_TOKENS.tagDismissIcon} />
                </button>
              </span>
            )}
            <button type="button" className={NC_FILTER_TOKENS.resetButton} onClick={clearFilters}>
              {t('list.filterReset')}
            </button>
          </>
        )}

        {/* 로딩 인디케이터 */}
        {isFetching && (
          <div className="ml-auto h-4 w-4 motion-safe:animate-spin rounded-full border-2 border-primary border-t-transparent" />
        )}
      </div>

      {/* 리스트 테이블 */}
      {ncList.length === 0 ? (
        <EmptyState hasFilters={activeCount > 0} onClear={clearFilters} />
      ) : (
        <div className={NC_LIST_TOKENS.wrapper}>
          {/* 테이블 헤더 */}
          <div className={NC_LIST_TOKENS.headerRow}>
            <span>{t('list.headerStatus')}</span>
            <span>{t('list.headerType')}</span>
            <span>{t('list.headerEquipment')}</span>
            <span>{t('list.headerCause')}</span>
            <span>{t('list.headerDiscoveryDate')}</span>
            <span>{t('list.headerElapsedDays')}</span>
            <span />
          </div>

          {/* 데이터 행 */}
          {ncList.map((nc, index) => (
            <NCListRow key={nc.id} nc={nc} index={index} />
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {pagination && pagination.totalPages > 1 && (
        <div className={NC_PAGINATION_TOKENS.container}>
          <span className={NC_PAGINATION_TOKENS.info}>
            {t('list.paginationInfo', {
              total: pagination.total,
              start: (pagination.currentPage - 1) * pagination.pageSize + 1,
              end: Math.min(pagination.currentPage * pagination.pageSize, pagination.total),
            })}
          </span>
          <div className={NC_PAGINATION_TOKENS.buttons}>
            <button
              type="button"
              disabled={pagination.currentPage <= 1}
              className={cn(NC_PAGINATION_TOKENS.pageButton, 'disabled:opacity-40')}
              onClick={() => updatePage(pagination.currentPage - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {generatePageNumbers(pagination.currentPage, pagination.totalPages).map((p) => (
              <button
                key={p}
                type="button"
                className={cn(
                  NC_PAGINATION_TOKENS.pageButton,
                  p === pagination.currentPage && NC_PAGINATION_TOKENS.pageButtonActive
                )}
                onClick={() => updatePage(p)}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={pagination.currentPage >= pagination.totalPages}
              className={cn(NC_PAGINATION_TOKENS.pageButton, 'disabled:opacity-40')}
              onClick={() => updatePage(pagination.currentPage + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * 리스트 행 컴포넌트
 */
function NCListRow({ nc, index }: { nc: NonConformance; index: number }) {
  const t = useTranslations('non-conformances');
  const { fmtDate } = useDateFormatter();
  const elapsedDays = computeElapsedDays(nc);
  const longOverdue = isNCLongOverdue(elapsedDays);
  const statusIndex = NC_STATUS_STEP_INDEX[nc.status] ?? 0;
  const hasRejection = !!nc.rejectionReason && nc.status === NCStatusVal.OPEN;

  return (
    <Link
      href={`/non-conformances/${nc.id}`}
      className={cn(
        NC_LIST_TOKENS.row,
        longOverdue && nc.status !== 'closed' && NC_LIST_TOKENS.rowOverdue
      )}
      style={{ animationDelay: `${index * NC_STAGGER_DELAY_MS}ms` }}
    >
      {/* 상태 + 미니 워크플로우 */}
      <div className="flex flex-col gap-0.5">
        <span className={getSemanticBadgeClasses(ncStatusToSemantic(nc.status))}>
          {t('ncStatus.' + nc.status)}
        </span>
        {hasRejection && (
          <span className={NC_REJECTION_BADGE_TOKENS.badge}>{t('list.rejectedBadge')}</span>
        )}
        <MiniWorkflow currentStepIndex={statusIndex} isLongOverdue={longOverdue} />
      </div>

      {/* 유형 */}
      <div>
        <span className={NC_TYPE_CHIP_TOKENS.base}>{t('ncType.' + nc.ncType)}</span>
      </div>

      {/* 장비 */}
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{nc.equipment?.name ?? '—'}</p>
        <p className={NC_LIST_TOKENS.managementNumber}>{nc.equipment?.managementNumber ?? '—'}</p>
      </div>

      {/* 원인 */}
      <div className="min-w-0">
        <p className={NC_LIST_TOKENS.causeTruncate}>{nc.cause}</p>
      </div>

      {/* 발견일 */}
      <div>
        <span className={NC_LIST_TOKENS.date}>{fmtDate(nc.discoveryDate)}</span>
      </div>

      {/* 경과일 */}
      <div>
        {nc.status !== 'closed' ? (
          <span className={getNCElapsedDaysClasses(elapsedDays)}>
            {t('list.elapsedDays', { days: elapsedDays })}
          </span>
        ) : (
          <span className="text-[13px] text-muted-foreground">—</span>
        )}
      </div>

      {/* 액션 */}
      <div>
        <span className={NC_LIST_TOKENS.actionButton}>
          <Eye className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

/**
 * 미니 4-step 워크플로우 프로그레스
 */
function MiniWorkflow({
  currentStepIndex,
  isLongOverdue,
}: {
  currentStepIndex: number;
  isLongOverdue: boolean;
}) {
  return (
    <div className={NC_MINI_WORKFLOW_TOKENS.container}>
      {NC_WORKFLOW_STEPS.map((_: string, stepIdx: number) => (
        <div key={stepIdx} className="flex items-center">
          {stepIdx > 0 && (
            <div className={getNCMiniConnectorClasses(stepIdx - 1, currentStepIndex)} />
          )}
          <div className={getNCMiniDotClasses(stepIdx, currentStepIndex, isLongOverdue)} />
        </div>
      ))}
    </div>
  );
}

/**
 * 빈 상태
 */
function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  const t = useTranslations('non-conformances');
  return (
    <div className={NC_EMPTY_STATE_TOKENS.container}>
      <FileWarning className={cn(NC_EMPTY_STATE_TOKENS.icon, 'mx-auto')} />
      <p className={NC_EMPTY_STATE_TOKENS.title}>
        {hasFilters ? t('list.emptyWithFilters') : t('list.emptyNoFilters')}
      </p>
      <p className={NC_EMPTY_STATE_TOKENS.description}>
        {hasFilters ? t('list.emptyWithFiltersDescription') : t('list.emptyNoFiltersDescription')}
      </p>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onClear} className="mt-4">
          {t('list.filterResetButton')}
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Utilities
// ============================================================================

/** 경과일 계산 (발견일 기준) */
function computeElapsedDays(nc: NonConformance): number {
  if (!nc.discoveryDate) return 0;
  return differenceInDays(new Date(), new Date(nc.discoveryDate));
}

/** KPI 카운트 계산 — 현재 페이지 데이터 기반 */
function computeKpiCounts(ncList: NonConformance[]): Record<NCKpiVariant, number> {
  const counts: Record<NCKpiVariant, number> = { open: 0, corrected: 0, closed: 0 };
  for (const nc of ncList) {
    const key = nc.status as NCKpiVariant;
    if (key in counts) counts[key]++;
  }
  return counts;
}

/** 페이지네이션 번호 생성 (현재 페이지 ±2) */
function generatePageNumbers(current: number, total: number): number[] {
  const pages: number[] = [];
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}
