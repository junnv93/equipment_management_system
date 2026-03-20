'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
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
import nonConformancesApi, {
  type NonConformance,
  NON_CONFORMANCE_STATUS_LABELS,
  NON_CONFORMANCE_TYPE_LABELS,
} from '@/lib/api/non-conformances-api';
import {
  type NonConformanceType,
  NonConformanceStatusValues as NCStatusVal,
} from '@equipment-management/schemas';
import type { PaginatedResponse } from '@/lib/api/types';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { useNCFilters } from '@/hooks/use-nc-filters';
import type { UINonConformancesFilters } from '@/lib/utils/non-conformances-filter-utils';
import { formatDate } from '@/lib/utils/date';
import { SITE_LABELS, type NonConformanceStatus, type Site } from '@equipment-management/schemas';
import {
  getSemanticBadgeClasses,
  ncStatusToSemantic,
  NC_HEADER_TOKENS,
  NC_KPI_TOKENS,
  NC_KPI_CARD_TOKENS,
  NC_KPI_LABELS,
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
  initialFilters,
}: NonConformancesContentProps) {
  const router = useRouter();
  const t = useTranslations('common');

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

  // ✅ TanStack Query — 서버 초기 데이터를 placeholderData로 사용
  const queryFilters = { ...apiFilters, includeSummary: true };
  const { data, isLoading, isFetching } = useQuery({
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
    const headers = ['상태', '유형', '장비명', '관리번호', '원인', '발견일', '경과일'];
    const rows = ncList.map((nc) => {
      const elapsed = computeElapsedDays(nc);
      return [
        NON_CONFORMANCE_STATUS_LABELS[nc.status as NonConformanceStatus] ?? nc.status,
        NON_CONFORMANCE_TYPE_LABELS[nc.ncType] ?? nc.ncType,
        nc.equipment?.name ?? '',
        nc.equipment?.managementNumber ?? '',
        nc.cause,
        nc.discoveryDate,
        nc.status !== 'closed' ? `${elapsed}일` : '',
      ];
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `부적합관리_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={getPageContainerClasses('list', 'space-y-5')}>
      {/* 헤더 */}
      <div className={NC_HEADER_TOKENS.container}>
        <div>
          <h1 className={NC_HEADER_TOKENS.title}>부적합 관리</h1>
          <p className={NC_HEADER_TOKENS.subtitle}>시스템 전체 부적합 현황 및 조치 진행 관리</p>
        </div>
        <div className={NC_HEADER_TOKENS.actionsGroup}>
          <Button variant="ghost" size="sm" onClick={handleExport} disabled={ncList.length === 0}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            내보내기
          </Button>
        </div>
      </div>

      {/* KPI 스트립 */}
      <div className="grid grid-cols-3 gap-3">
        {(Object.keys(NC_KPI_LABELS) as NCKpiVariant[]).map((variant) => {
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
                <p className={NC_KPI_CARD_TOKENS.label}>{NC_KPI_LABELS[variant]}</p>
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
            placeholder="장비명, 관리번호, 원인 검색..."
            value={filters.search}
            onChange={(e) => updateSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>

        <div className={NC_FILTER_TOKENS.divider} />

        {/* 상태 필터 */}
        <Select
          value={filters.status || '_all'}
          onValueChange={(v) => updateStatus((v === '_all' ? '' : v) as NonConformanceStatus | '')}
        >
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">전체 상태</SelectItem>
            {Object.entries(NON_CONFORMANCE_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 유형 필터 */}
        <Select
          value={filters.ncType || '_all'}
          onValueChange={(v) => updateNCType((v === '_all' ? '' : v) as NonConformanceType | '')}
        >
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue placeholder="유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">전체 유형</SelectItem>
            {Object.entries(NON_CONFORMANCE_TYPE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 사이트 필터 */}
        <Select
          value={filters.site || '_all'}
          onValueChange={(v) => updateSite((v === '_all' ? '' : v) as Site | '')}
        >
          <SelectTrigger className="h-8 w-[110px] text-xs">
            <SelectValue placeholder="사이트" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">전체 사이트</SelectItem>
            {Object.entries(SITE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
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
                {NON_CONFORMANCE_STATUS_LABELS[filters.status as NonConformanceStatus]}
                <button type="button" onClick={() => updateStatus('')}>
                  <X className={NC_FILTER_TOKENS.tagDismissIcon} />
                </button>
              </span>
            )}
            {filters.ncType && (
              <span className={NC_FILTER_TOKENS.tag}>
                {NON_CONFORMANCE_TYPE_LABELS[filters.ncType as NonConformanceType]}
                <button type="button" onClick={() => updateNCType('')}>
                  <X className={NC_FILTER_TOKENS.tagDismissIcon} />
                </button>
              </span>
            )}
            {filters.site && (
              <span className={NC_FILTER_TOKENS.tag}>
                {SITE_LABELS[filters.site as keyof typeof SITE_LABELS]}
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
              초기화
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
            <span>상태</span>
            <span>유형</span>
            <span>장비</span>
            <span>원인</span>
            <span>발견일</span>
            <span>경과일</span>
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
            총 {pagination.total}건 중 {(pagination.currentPage - 1) * pagination.pageSize + 1}–
            {Math.min(pagination.currentPage * pagination.pageSize, pagination.total)}건
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
          {NON_CONFORMANCE_STATUS_LABELS[nc.status as NonConformanceStatus]}
        </span>
        {hasRejection && <span className={NC_REJECTION_BADGE_TOKENS.badge}>반려됨</span>}
        <MiniWorkflow currentStepIndex={statusIndex} isLongOverdue={longOverdue} />
      </div>

      {/* 유형 */}
      <div>
        <span className={NC_TYPE_CHIP_TOKENS.base}>
          {NON_CONFORMANCE_TYPE_LABELS[nc.ncType] ?? nc.ncType}
        </span>
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
        <span className={NC_LIST_TOKENS.date}>{formatDate(nc.discoveryDate)}</span>
      </div>

      {/* 경과일 */}
      <div>
        {nc.status !== 'closed' ? (
          <span className={getNCElapsedDaysClasses(elapsedDays)}>{elapsedDays}일</span>
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
  return (
    <div className={NC_EMPTY_STATE_TOKENS.container}>
      <FileWarning className={cn(NC_EMPTY_STATE_TOKENS.icon, 'mx-auto')} />
      <p className={NC_EMPTY_STATE_TOKENS.title}>
        {hasFilters ? '조건에 맞는 부적합 사항이 없습니다' : '등록된 부적합 사항이 없습니다'}
      </p>
      <p className={NC_EMPTY_STATE_TOKENS.description}>
        {hasFilters
          ? '필터를 변경하거나 초기화해 보세요'
          : '장비 상세 페이지에서 부적합을 등록할 수 있습니다'}
      </p>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onClear} className="mt-4">
          필터 초기화
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
