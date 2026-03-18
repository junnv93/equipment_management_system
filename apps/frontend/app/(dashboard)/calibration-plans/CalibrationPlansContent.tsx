'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import calibrationPlansApi, {
  type CalibrationPlan,
  type CalibrationPlanSummary,
  CALIBRATION_PLAN_STATUS_LABELS,
  SITE_LABELS,
} from '@/lib/api/calibration-plans-api';
import teamsApi from '@/lib/api/teams-api';
import type { PaginatedResponse } from '@/lib/api/types';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { useCalibrationPlansFilters } from '@/hooks/use-calibration-plans-filters';
import type { UICalibrationPlansFilters } from '@/lib/utils/calibration-plans-filter-utils';
import { format } from 'date-fns';
import {
  Plus,
  FileText,
  Calendar,
  Building2,
  Users,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { CalibrationPlanStatus, UserRole, Site } from '@equipment-management/schemas';
import {
  TEAM_RESTRICTED_ROLES,
  CALIBRATION_PLAN_DATA_SCOPE,
  resolveDataScope,
} from '@equipment-management/shared-constants';
import {
  CALIBRATION_PLAN_HEADER_TOKENS,
  CALIBRATION_PLAN_KPI_TOKENS,
  CALIBRATION_PLAN_LIST_TOKENS,
  CALIBRATION_PLAN_FILTER_TOKENS,
  CALIBRATION_PLAN_STATUS_BADGE_COLORS,
  getPageContainerClasses,
  PAGE_HEADER_TOKENS,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

interface CalibrationPlansContentProps {
  /** 서버에서 가져온 초기 데이터 */
  initialData: PaginatedResponse<CalibrationPlan, CalibrationPlanSummary>;
  /** 초기 필터 (SSOT 패턴) */
  initialFilters?: UICalibrationPlansFilters;
}

/**
 * 교정계획서 목록 Client Component
 *
 * SSOT 패턴:
 * - URL 파라미터가 유일한 진실의 소스 (useCalibrationPlansFilters 훅)
 * - Server Component에서 초기 데이터를 받아 React Query로 관리
 */
export default function CalibrationPlansContent({
  initialData,
  initialFilters,
}: CalibrationPlansContentProps) {
  const currentYear = new Date().getFullYear();
  const { data: session } = useSession();
  const t = useTranslations('calibration');

  // ✅ SSOT: URL-driven 필터 (useState 제거)
  const { filters, apiFilters, updateYear, updateSiteId, updateTeamId, updateStatus, updatePage } =
    useCalibrationPlansFilters(initialFilters);
  const tc = useTranslations('common');

  // 역할 확인
  const userRole = session?.user?.role;
  const isTeamRestricted = userRole && TEAM_RESTRICTED_ROLES.includes(userRole as UserRole);

  // 사이트 필터 고정 여부: CALIBRATION_PLAN_DATA_SCOPE에서 scope=site인 역할만 고정
  const isSiteFixed = userRole
    ? resolveDataScope(
        { role: userRole as UserRole, site: session?.user?.site },
        CALIBRATION_PLAN_DATA_SCOPE
      ).type === 'site'
    : false;

  // 팀 목록 조회 (필터링용)
  const { data: teamsData } = useQuery({
    queryKey: queryKeys.teams.list({ site: filters.siteId || undefined }),
    queryFn: () =>
      teamsApi.getTeams({ site: (filters.siteId as Site) || undefined, pageSize: 100 }),
    enabled: !!filters.siteId,
  });

  const teams = teamsData?.data || [];

  // 교정계획서 목록 조회 (초기 데이터 활용)
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.calibrationPlans.list(apiFilters),
    queryFn: () =>
      calibrationPlansApi.getCalibrationPlans({
        ...apiFilters,
        year: apiFilters.year ? Number(apiFilters.year) : undefined,
        includeSummary: true,
      }),
    placeholderData: initialData,
    ...QUERY_CONFIG.CALIBRATION_PLANS,
  });

  const plans = data?.data || [];
  // ✅ 서버 집계 summary 사용 (페이지네이션에 무관한 정확한 전체 통계)
  const summary = data?.meta?.summary;

  // ✅ 방어 코드: id 검증 및 경고 (SSOT: backend id = UUID string)
  if (process.env.NODE_ENV === 'development' && plans.length > 0) {
    const invalidPlans = plans.filter((plan) => !plan.id);
    if (invalidPlans.length > 0) {
      console.warn(
        '[CalibrationPlansContent] ID 누락된 계획서 발견:',
        invalidPlans.map((p, idx) => ({ index: idx, year: p.year, siteId: p.siteId }))
      );
    }
  }

  // 연도 옵션 생성 (현재 연도 기준 +-2년)
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const kpiItems: Array<{
    key: string;
    label: string;
    count: number;
    variant: keyof typeof CALIBRATION_PLAN_KPI_TOKENS.borderColors;
    filterStatus?: CalibrationPlanStatus;
  }> = [
    { key: 'total', label: t('plansList.kpi.total'), count: summary?.total ?? 0, variant: 'total' },
    {
      key: 'draft',
      label: t('planStatus.draft'),
      count: summary?.draft ?? 0,
      variant: 'draft',
      filterStatus: 'draft',
    },
    {
      key: 'pendingReview',
      label: t('planStatus.pending_review'),
      count: summary?.pending_review ?? 0,
      variant: 'pendingReview',
      filterStatus: 'pending_review',
    },
    {
      key: 'pendingApproval',
      label: t('planStatus.pending_approval'),
      count: summary?.pending_approval ?? 0,
      variant: 'pendingApproval',
      filterStatus: 'pending_approval',
    },
    {
      key: 'approved',
      label: t('planStatus.approved'),
      count: summary?.approved ?? 0,
      variant: 'approved',
      filterStatus: 'approved',
    },
  ];

  return (
    <div className={getPageContainerClasses()}>
      {/* ── 헤더 ──────────────────────────────────────────────── */}
      <div className={CALIBRATION_PLAN_HEADER_TOKENS.container}>
        <div className={PAGE_HEADER_TOKENS.titleGroup}>
          <h1 className={PAGE_HEADER_TOKENS.title}>{t('plansList.title')}</h1>
          <p className={PAGE_HEADER_TOKENS.subtitle}>{t('plansList.subtitle')}</p>
        </div>
        <div className={CALIBRATION_PLAN_HEADER_TOKENS.actionsGroup}>
          <Button asChild>
            <Link href="/calibration-plans/create">
              <Plus className="h-4 w-4 mr-2" />
              {t('plansList.createButton')}
            </Link>
          </Button>
        </div>
      </div>

      {/* ── KPI 스트립 ──────────────────────────────────────────── */}
      <div className={CALIBRATION_PLAN_KPI_TOKENS.container}>
        {kpiItems.map((item) => {
          const isClickable = !!item.filterStatus;
          const isActive = filters.status === (item.filterStatus ?? '');
          const cardClasses = cn(
            CALIBRATION_PLAN_KPI_TOKENS.card.base,
            CALIBRATION_PLAN_KPI_TOKENS.borderColors[item.variant],
            isClickable && CALIBRATION_PLAN_KPI_TOKENS.card.hover,
            isClickable && CALIBRATION_PLAN_KPI_TOKENS.card.focus,
            isClickable && CALIBRATION_PLAN_KPI_TOKENS.card.clickable,
            isActive && CALIBRATION_PLAN_KPI_TOKENS.card.active
          );
          const content = (
            <>
              <div
                className={cn(
                  CALIBRATION_PLAN_KPI_TOKENS.iconContainer,
                  CALIBRATION_PLAN_KPI_TOKENS.iconBg[item.variant]
                )}
              >
                <ClipboardList className="h-4 w-4" />
              </div>
              <div>
                <div className={CALIBRATION_PLAN_KPI_TOKENS.value}>{item.count}</div>
                <div className={CALIBRATION_PLAN_KPI_TOKENS.label}>{item.label}</div>
              </div>
            </>
          );

          return isClickable ? (
            <button
              key={item.key}
              type="button"
              className={cardClasses}
              onClick={() =>
                updateStatus(filters.status === item.filterStatus ? '' : item.filterStatus!)
              }
            >
              {content}
            </button>
          ) : (
            <div key={item.key} className={cardClasses}>
              {content}
            </div>
          );
        })}
      </div>

      {/* ── 필터 바 ──────────────────────────────────────────── */}
      <div className={CALIBRATION_PLAN_FILTER_TOKENS.bar}>
        <div className="space-y-1">
          <Label className={CALIBRATION_PLAN_FILTER_TOKENS.fieldLabel}>
            {t('plansList.table.year')}
          </Label>
          <Select value={filters.year || String(currentYear)} onValueChange={updateYear}>
            <SelectTrigger className={cn(CALIBRATION_PLAN_FILTER_TOKENS.select, 'w-[120px]')}>
              <SelectValue placeholder={t('plansList.filter.yearPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {t('plansList.yearUnit', { year })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className={CALIBRATION_PLAN_FILTER_TOKENS.fieldLabel}>
            {t('plansList.table.site')}
          </Label>
          <Select
            value={filters.siteId || '_all'}
            onValueChange={(v) => updateSiteId((v === '_all' ? '' : v) as Site | '')}
            disabled={isSiteFixed}
          >
            <SelectTrigger
              className={cn(
                CALIBRATION_PLAN_FILTER_TOKENS.select,
                'w-[130px]',
                isSiteFixed && 'cursor-not-allowed opacity-60'
              )}
            >
              <SelectValue placeholder={t('plansList.filter.sitePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">{t('plansList.filter.allSites')}</SelectItem>
              {Object.entries(SITE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className={CALIBRATION_PLAN_FILTER_TOKENS.fieldLabel}>
            <Users className="h-3 w-3 inline mr-1" />
            {t('planCreate.fields.team')}
          </Label>
          <Select
            value={filters.teamId || '_all'}
            onValueChange={(v) => updateTeamId(v === '_all' ? '' : v)}
            disabled={!filters.siteId || !!isTeamRestricted}
          >
            <SelectTrigger className={cn(CALIBRATION_PLAN_FILTER_TOKENS.select, 'w-[160px]')}>
              <SelectValue placeholder={t('plansList.filter.teamPlaceholder')}>
                {filters.teamId
                  ? teams.find((tm) => tm.id === filters.teamId)?.name ||
                    t('plansList.filter.teamPlaceholder')
                  : t('plansList.filter.allTeams')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {!isTeamRestricted && (
                <SelectItem value="_all">{t('plansList.filter.allTeams')}</SelectItem>
              )}
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
              {teams.length === 0 && (
                <div className="p-2 text-sm text-muted-foreground">
                  {t('plansList.filter.selectSiteFirst')}
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className={CALIBRATION_PLAN_FILTER_TOKENS.fieldLabel}>
            {t('plansList.table.status')}
          </Label>
          <Select
            value={filters.status || '_all'}
            onValueChange={(v) =>
              updateStatus((v === '_all' ? '' : v) as CalibrationPlanStatus | '')
            }
          >
            <SelectTrigger className={cn(CALIBRATION_PLAN_FILTER_TOKENS.select, 'w-[140px]')}>
              <SelectValue placeholder={t('plansList.filter.statusPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">{t('plansList.filter.allStatuses')}</SelectItem>
              {(
                Object.entries(CALIBRATION_PLAN_STATUS_LABELS) as [CalibrationPlanStatus, string][]
              ).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── 계획서 목록 (컴팩트 로우) ────────────────────────────── */}
      <div className="rounded-xl border border-brand-border-subtle bg-brand-bg-surface">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t('plansList.list.error')}</p>
          </div>
        ) : plans.length === 0 ? (
          <div className={CALIBRATION_PLAN_LIST_TOKENS.empty.container}>
            <div className={CALIBRATION_PLAN_LIST_TOKENS.empty.iconContainer}>
              <FileText className={CALIBRATION_PLAN_LIST_TOKENS.empty.icon} />
            </div>
            <p className={CALIBRATION_PLAN_LIST_TOKENS.empty.text}>{t('plansList.list.empty')}</p>
            <Button asChild className="mt-4">
              <Link href="/calibration-plans/create">
                <Plus className="h-4 w-4 mr-2" />
                {t('plansList.createButton')}
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* 헤더 행 */}
            <div className={CALIBRATION_PLAN_LIST_TOKENS.container.header}>
              <span>{t('plansList.table.year')}</span>
              <span>{t('plansList.table.site')}</span>
              <span>{t('planCreate.fields.team')}</span>
              <span>{t('plansList.table.status')}</span>
              <span>{t('plansList.table.author')}</span>
              <span>{t('plansList.table.createdAt')}</span>
              <span className="text-right">{t('plansList.table.action')}</span>
            </div>

            {/* 데이터 행 */}
            {plans.map((plan: CalibrationPlan, index: number) => {
              const key = plan.id || `plan-fallback-${plan.year}-${plan.siteId}-${index}`;

              return (
                <div
                  key={key}
                  className={cn(
                    CALIBRATION_PLAN_LIST_TOKENS.container.base,
                    CALIBRATION_PLAN_LIST_TOKENS.container.desktop,
                    CALIBRATION_PLAN_LIST_TOKENS.container.mobile,
                    CALIBRATION_PLAN_LIST_TOKENS.hover,
                    'cursor-pointer'
                  )}
                  role="button"
                  tabIndex={0}
                  onClick={() => plan.id && router.push(`/calibration-plans/${plan.id}`)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && plan.id) {
                      e.preventDefault();
                      router.push(`/calibration-plans/${plan.id}`);
                    }
                  }}
                >
                  {/* 연도 */}
                  <div className={CALIBRATION_PLAN_LIST_TOKENS.yearCell}>
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground inline mr-1.5 lg:hidden" />
                    {t('plansList.yearUnit', { year: plan.year })}
                  </div>

                  {/* 시험소 */}
                  <div className={CALIBRATION_PLAN_LIST_TOKENS.siteCell}>
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    {SITE_LABELS[plan.siteId] || plan.siteId}
                  </div>

                  {/* 팀 */}
                  <div className={CALIBRATION_PLAN_LIST_TOKENS.teamCell}>
                    {plan.teamId
                      ? teams.find((tm) => tm.id === plan.teamId)?.name || plan.teamId
                      : '-'}
                  </div>

                  {/* 상태 배지 — Design Token 사용 */}
                  <div>
                    <Badge className={CALIBRATION_PLAN_STATUS_BADGE_COLORS[plan.status]}>
                      {CALIBRATION_PLAN_STATUS_LABELS[plan.status]}
                    </Badge>
                  </div>

                  {/* 작성자 */}
                  <div className={CALIBRATION_PLAN_LIST_TOKENS.authorCell}>{plan.createdBy}</div>

                  {/* 작성일 */}
                  <div className={CALIBRATION_PLAN_LIST_TOKENS.dateCell}>
                    {format(new Date(plan.createdAt), 'yyyy-MM-dd')}
                  </div>

                  {/* 액션 */}
                  <div
                    className={cn(CALIBRATION_PLAN_LIST_TOKENS.actions.container, 'justify-end')}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className={CALIBRATION_PLAN_LIST_TOKENS.actions.iconButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (plan.id) router.push(`/calibration-plans/${plan.id}`);
                      }}
                      disabled={!plan.id}
                      aria-label={t('plansList.detail')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ── 페이지네이션 ──────────────────────────────────────── */}
      {data?.meta?.pagination && data.meta.pagination.totalPages > 1 && (
        <div
          className="flex items-center justify-between text-sm text-muted-foreground"
          role="navigation"
          aria-label={tc('pagination.totalItems', { count: data.meta.pagination.total })}
        >
          <span>{tc('pagination.totalItems', { count: data.meta.pagination.total })}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updatePage(filters.page - 1)}
              disabled={filters.page <= 1}
              aria-label={tc('pagination.previous')}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {tc('pagination.previous')}
            </Button>
            <span className="tabular-nums">
              {tc('pagination.pageOf', {
                current: filters.page,
                total: data.meta.pagination.totalPages,
              })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updatePage(filters.page + 1)}
              disabled={filters.page >= data.meta.pagination.totalPages}
              aria-label={tc('pagination.next')}
            >
              {tc('pagination.next')}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
