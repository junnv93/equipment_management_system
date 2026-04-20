'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
} from '@/lib/api/calibration-plans-api';
import teamsApi from '@/lib/api/teams-api';
import type { PaginatedResponse } from '@/lib/api/types';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { useCalibrationPlansFilters } from '@/hooks/use-calibration-plans-filters';
import type { UICalibrationPlansFilters } from '@/lib/utils/calibration-plans-filter-utils';
import { resolveDisplayName } from '@/lib/utils/display-name';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { Plus, FileText, Users, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';
import { ErrorState } from '@/components/shared/ErrorState';
import { useTranslations } from 'next-intl';
import { CALIBRATION_PLAN_STATUS_VALUES } from '@equipment-management/schemas';
import { useSiteLabels } from '@/lib/i18n/use-enum-labels';
import type { CalibrationPlanStatus, UserRole, Site } from '@equipment-management/schemas';
import {
  TEAM_RESTRICTED_ROLES,
  CALIBRATION_PLAN_DATA_SCOPE,
  resolveDataScope,
  SELECTOR_PAGE_SIZE,
  Permission,
} from '@equipment-management/shared-constants';
import {
  CALIBRATION_PLAN_KPI_TOKENS,
  CALIBRATION_PLAN_LIST_TOKENS,
  CALIBRATION_PLAN_FILTER_TOKENS,
  getPageContainerClasses,
} from '@/lib/design-tokens';
import { PlanStatusBadge } from '@/components/calibration-plans/PlanStatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { cn } from '@/lib/utils';
import { useFilterSelect } from '@/lib/utils/filter-select-utils';

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
  const { session, can } = useAuth();
  const { fmtDate } = useDateFormatter();
  const t = useTranslations('calibration');

  // ✅ SSOT: URL-driven 필터 (useState 제거)
  const { filters, apiFilters, updateYear, updateSiteId, updateTeamId, updateStatus, updatePage } =
    useCalibrationPlansFilters(initialFilters);
  const tc = useTranslations('common');
  const siteLabels = useSiteLabels();

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

  // 계획서 생성 권한 체크 (QM은 CREATE_CALIBRATION_PLAN 없음)
  const canCreatePlan = can(Permission.CREATE_CALIBRATION_PLAN);

  // 팀 목록 조회 (필터링용)
  const { data: teamsData } = useQuery({
    queryKey: queryKeys.teams.list({ site: filters.siteId || undefined }),
    queryFn: () =>
      teamsApi.getTeams({
        site: (filters.siteId as Site) || undefined,
        pageSize: SELECTOR_PAGE_SIZE,
      }),
    enabled: !!filters.siteId,
  });

  const teams = teamsData?.data || [];

  // ✅ Select spurious onValueChange guard (SSOT: useFilterSelect)
  const siteSelect = useFilterSelect(filters.siteId, updateSiteId);
  const teamSelect = useFilterSelect(filters.teamId, updateTeamId);
  const statusSelect = useFilterSelect(filters.status, updateStatus);

  // 교정계획서 목록 조회 (초기 데이터 활용)
  const { data, isLoading, isError, refetch } = useQuery({
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
      <PageHeader
        title={t('plansList.title')}
        subtitle={t('plansList.subtitle')}
        actions={
          canCreatePlan ? (
            <Button asChild>
              <Link href="/calibration-plans/create">
                <Plus className="h-4 w-4 mr-2" />
                {t('plansList.createButton')}
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* ── KPI 스트립 ──────────────────────────────────────────── */}
      <div className={CALIBRATION_PLAN_KPI_TOKENS.container}>
        {kpiItems.map((item, index) => {
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
          const motionClasses = cn(
            CALIBRATION_PLAN_KPI_TOKENS.motion.entrance,
            CALIBRATION_PLAN_KPI_TOKENS.motion.duration,
            'motion-safe:fill-mode-forwards'
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

          const staggerStyle = {
            animationDelay: CALIBRATION_PLAN_KPI_TOKENS.motion.getDelay(index),
          };

          return isClickable ? (
            <button
              key={item.key}
              type="button"
              className={cn(cardClasses, motionClasses)}
              style={staggerStyle}
              aria-pressed={isActive}
              aria-label={t('plansList.kpi.filterByStatus', {
                status: item.label,
                count: item.count,
              })}
              onClick={() =>
                updateStatus(filters.status === item.filterStatus ? '' : item.filterStatus!)
              }
            >
              {content}
            </button>
          ) : (
            <div
              key={item.key}
              className={cn(cardClasses, motionClasses)}
              style={staggerStyle}
              aria-label={`${item.label}: ${item.count}`}
            >
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
          <Select value={filters.year || '_all'} onValueChange={updateYear}>
            <SelectTrigger className={cn(CALIBRATION_PLAN_FILTER_TOKENS.select, 'w-[130px]')}>
              <SelectValue placeholder={t('plansList.filter.yearPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">{t('plansList.filter.allYears')}</SelectItem>
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
          <Select {...siteSelect} disabled={isSiteFixed}>
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
              {Object.entries(siteLabels).map(([key, label]) => (
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
          <Select {...teamSelect} disabled={!filters.siteId || !!isTeamRestricted}>
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
          <Select {...statusSelect}>
            <SelectTrigger className={cn(CALIBRATION_PLAN_FILTER_TOKENS.select, 'w-[140px]')}>
              <SelectValue placeholder={t('plansList.filter.statusPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">{t('plansList.filter.allStatuses')}</SelectItem>
              {CALIBRATION_PLAN_STATUS_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`planStatus.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── 계획서 목록 ────────────────────────────── */}
      <div className={CALIBRATION_PLAN_LIST_TOKENS.container.wrapper}>
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6">
            <ErrorState
              title={t('plansList.list.error')}
              onRetry={() => void refetch()}
              retryLabel="다시 시도"
            />
          </div>
        ) : plans.length === 0 ? (
          <div className={CALIBRATION_PLAN_LIST_TOKENS.empty.container}>
            <div className={CALIBRATION_PLAN_LIST_TOKENS.empty.iconContainer}>
              <FileText className={CALIBRATION_PLAN_LIST_TOKENS.empty.icon} />
            </div>
            <p className={CALIBRATION_PLAN_LIST_TOKENS.empty.text}>{t('plansList.list.empty')}</p>
            {canCreatePlan && (
              <Button asChild className="mt-4">
                <Link href="/calibration-plans/create">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('plansList.createButton')}
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('plansList.table.year')}</TableHead>
                <TableHead>{t('plansList.table.site')}</TableHead>
                <TableHead>{t('planCreate.fields.team')}</TableHead>
                <TableHead>{t('plansList.table.status')}</TableHead>
                <TableHead>{t('plansList.table.author')}</TableHead>
                <TableHead>{t('plansList.table.createdAt')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan: CalibrationPlan, index: number) => {
                const key = plan.id || `plan-fallback-${plan.year}-${plan.siteId}-${index}`;
                const teamName =
                  plan.teamName ||
                  (plan.teamId ? teams.find((tm) => tm.id === plan.teamId)?.name : null);

                return (
                  <TableRow key={key} className="relative cursor-pointer">
                    <TableCell className="font-semibold tabular-nums">
                      {/* 행 전체를 키보드(Tab+Enter)로 접근 가능하게 하는 invisible overlay link */}
                      <Link
                        href={`/calibration-plans/${plan.id}`}
                        className="absolute inset-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm"
                        aria-label={t('plansList.rowAriaLabel', {
                          year: plan.year,
                          site: siteLabels[plan.siteId as keyof typeof siteLabels] || plan.siteId,
                          status: t(`planStatus.${plan.status}`),
                        })}
                        tabIndex={0}
                      />
                      {t('plansList.yearUnit', { year: plan.year })}
                    </TableCell>
                    <TableCell>
                      {siteLabels[plan.siteId as keyof typeof siteLabels] || plan.siteId}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{teamName || '-'}</TableCell>
                    <TableCell>
                      <PlanStatusBadge status={plan.status} />
                    </TableCell>
                    <TableCell className="truncate max-w-[160px]">
                      {resolveDisplayName(plan.authorName, plan.createdBy)}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {fmtDate(plan.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
