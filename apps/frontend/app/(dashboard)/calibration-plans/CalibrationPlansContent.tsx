'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import calibrationPlansApi, {
  CalibrationPlan,
  CALIBRATION_PLAN_STATUS_LABELS,
  CALIBRATION_PLAN_STATUS_COLORS,
  SITE_LABELS,
} from '@/lib/api/calibration-plans-api';
import teamsApi from '@/lib/api/teams-api';
import type { PaginatedResponse } from '@/lib/api/types';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { useCalibrationPlansFilters } from '@/hooks/use-calibration-plans-filters';
import type { UICalibrationPlansFilters } from '@/lib/utils/calibration-plans-filter-utils';
import { format } from 'date-fns';
import { Plus, FileText, Calendar, Building2, Eye, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { CalibrationPlanStatus, UserRole, Site } from '@equipment-management/schemas';
import {
  TEAM_RESTRICTED_ROLES,
  CALIBRATION_PLAN_DATA_SCOPE,
  resolveDataScope,
} from '@equipment-management/shared-constants';
import {
  FILTER_TOKENS,
  getFilterSelectClasses,
  getNumericClasses,
  CARD_TOKENS,
  getTableRowClasses,
} from '@/lib/design-tokens';

interface CalibrationPlansContentProps {
  /** 서버에서 가져온 초기 데이터 */
  initialData: PaginatedResponse<CalibrationPlan>;
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
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const { data: session } = useSession();
  const t = useTranslations('calibration');

  // ✅ SSOT: URL-driven 필터 (useState 제거)
  const { filters, apiFilters, updateYear, updateSiteId, updateTeamId, updateStatus } =
    useCalibrationPlansFilters(initialFilters);

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
      }),
    placeholderData: initialData,
    ...QUERY_CONFIG.CALIBRATION_PLANS,
  });

  const plans = data?.data || [];

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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('plansList.title')}</h1>
          <p className="text-muted-foreground">{t('plansList.subtitle')}</p>
        </div>
        <Button asChild>
          <Link href="/calibration-plans/create">
            <Plus className="h-4 w-4 mr-2" />
            {t('plansList.createButton')}
          </Link>
        </Button>
      </div>

      {/* 필터 — Design Token 적용 */}
      <Card>
        <CardHeader>
          <CardTitle className={CARD_TOKENS.header.title}>{t('plansList.filter.title')}</CardTitle>
        </CardHeader>
        <CardContent className={CARD_TOKENS.content.spacing}>
          <div className={`flex ${FILTER_TOKENS.container.gap}`}>
            <div className={FILTER_TOKENS.width.year}>
              <Select value={filters.year || String(currentYear)} onValueChange={updateYear}>
                <SelectTrigger className={getFilterSelectClasses()}>
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
            <div className={FILTER_TOKENS.width.site}>
              <Select
                value={filters.siteId || '_all'}
                onValueChange={(v) => updateSiteId(v === '_all' ? '' : v)}
                disabled={isSiteFixed}
              >
                <SelectTrigger
                  className={`${getFilterSelectClasses()}${isSiteFixed ? ' cursor-not-allowed opacity-60' : ''}`}
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
            <div className={FILTER_TOKENS.width.team}>
              <Select
                value={filters.teamId || '_all'}
                onValueChange={(v) => updateTeamId(v === '_all' ? '' : v)}
                disabled={!filters.siteId || !!isTeamRestricted}
              >
                <SelectTrigger className={getFilterSelectClasses()}>
                  <SelectValue placeholder={t('plansList.filter.teamPlaceholder')}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {filters.teamId
                        ? teams.find((tm) => tm.id === filters.teamId)?.name ||
                          t('plansList.filter.teamPlaceholder')
                        : t('plansList.filter.allTeams')}
                    </div>
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
            <div className={FILTER_TOKENS.width.status}>
              <Select
                value={filters.status || '_all'}
                onValueChange={(v) => updateStatus(v === '_all' ? '' : v)}
              >
                <SelectTrigger className={getFilterSelectClasses()}>
                  <SelectValue placeholder={t('plansList.filter.statusPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">{t('plansList.filter.allStatuses')}</SelectItem>
                  {(
                    Object.entries(CALIBRATION_PLAN_STATUS_LABELS) as [
                      CalibrationPlanStatus,
                      string,
                    ][]
                  ).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 계획서 목록 — Design Token 적용 */}
      <Card>
        <CardHeader>
          <CardTitle className={CARD_TOKENS.header.title}>{t('plansList.list.title')}</CardTitle>
          <CardDescription className={CARD_TOKENS.header.description}>
            {t('plansList.list.description', { count: plans.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : isError ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t('plansList.list.error')}</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('plansList.list.empty')}</p>
              <Button asChild className="mt-4">
                <Link href="/calibration-plans/create">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('plansList.createButton')}
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('plansList.table.year')}</TableHead>
                  <TableHead>{t('plansList.table.site')}</TableHead>
                  <TableHead>{t('plansList.table.status')}</TableHead>
                  <TableHead>{t('plansList.table.author')}</TableHead>
                  <TableHead>{t('plansList.table.createdAt')}</TableHead>
                  <TableHead>{t('plansList.table.approvedAt')}</TableHead>
                  <TableHead className="text-right">{t('plansList.table.action')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan: CalibrationPlan, index: number) => {
                  // SSOT: backend id = UUID string (fallback key for safety)
                  const key = plan.id || `plan-fallback-${plan.year}-${plan.siteId}-${index}`;

                  return (
                    <TableRow key={key} className={getTableRowClasses()}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {t('plansList.yearUnit', { year: plan.year })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {SITE_LABELS[plan.siteId] || plan.siteId}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={CALIBRATION_PLAN_STATUS_COLORS[plan.status]}>
                          {CALIBRATION_PLAN_STATUS_LABELS[plan.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{plan.createdBy}</TableCell>
                      <TableCell>{format(new Date(plan.createdAt), 'yyyy-MM-dd')}</TableCell>
                      <TableCell>
                        {plan.approvedAt ? format(new Date(plan.approvedAt), 'yyyy-MM-dd') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/calibration-plans/${plan.id}`)}
                          disabled={!plan.id}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t('plansList.detail')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
