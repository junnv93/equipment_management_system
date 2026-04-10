'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, CheckSquare, ClipboardCheck, CircleDot, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import calibrationApi, { type CalibrationSummary } from '@/lib/api/calibration-api';
import { apiClient } from '@/lib/api/api-client';
import { API_ENDPOINTS, SELECTOR_PAGE_SIZE } from '@equipment-management/shared-constants';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import {
  CALIBRATION_THRESHOLDS,
  CALIBRATION_FILTER_BAR,
  getPageContainerClasses,
} from '@/lib/design-tokens';
import { PageHeader } from '@/components/shared/PageHeader';
import { useTranslations } from 'next-intl';
import type { UICalibrationFilters } from '@/lib/utils/calibration-filter-utils';
import { useCalibrationFilters } from '@/hooks/use-calibration-filters';
import { useFilterSelect } from '@/lib/utils/filter-select-utils';
import { countActiveFilters } from '@/lib/utils/calibration-filter-utils';
import { useSiteLabels } from '@/lib/i18n/use-enum-labels';
import { CALIBRATION_DUE_STATUS_VALUES } from '@/lib/utils/calibration-filter-utils';
import { Permission, FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { useAuth } from '@/hooks/use-auth';
import CalibrationStatsCards from '@/components/calibration/CalibrationStatsCards';
import CalibrationTimeline, {
  type CalibrationTimelineItem,
} from '@/components/calibration/CalibrationTimeline';
import CalibrationListTable from '@/components/calibration/CalibrationListTable';
import CalibrationAlertBanners from '@/components/calibration/CalibrationAlertBanners';

interface CalibrationContentProps {
  initialSummary?: CalibrationSummary;
  initialFilters?: UICalibrationFilters;
}

export default function CalibrationContent({
  initialSummary,
  initialFilters,
}: CalibrationContentProps) {
  const t = useTranslations('calibration');
  const siteLabels = useSiteLabels();
  const {
    filters,
    updateSearch,
    updateSite,
    updateTeamId,
    updateApprovalStatus,
    updateResult,
    updateCalibrationDueStatus,
    clearFilters,
  } = useCalibrationFilters(initialFilters);

  const defaultTeamId = filters.teamId || initialFilters?.teamId;
  const defaultSite = filters.site || initialFilters?.site;
  const router = useRouter();

  // ✅ Select spurious onValueChange guard (SSOT: useFilterSelect)
  const siteSelect = useFilterSelect(filters.site, updateSite);
  const teamSelect = useFilterSelect(filters.teamId, updateTeamId, 'all');
  const approvalSelect = useFilterSelect(filters.approvalStatus, updateApprovalStatus, 'all');
  const resultSelect = useFilterSelect(filters.result, updateResult, 'all');
  const calibrationDueStatusSelect = useFilterSelect(
    filters.calibrationDueStatus,
    updateCalibrationDueStatus,
    'all'
  );
  const { can } = useAuth();
  const canCreateCalibration = can(Permission.CREATE_CALIBRATION);

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: summaryData } = useQuery({
    queryKey: queryKeys.calibrations.summary(defaultTeamId, defaultSite),
    queryFn: () => calibrationApi.getCalibrationSummary(defaultTeamId, defaultSite),
    placeholderData: initialSummary,
    ...QUERY_CONFIG.CALIBRATION_SUMMARY,
  });

  const { data: overdueData } = useQuery({
    queryKey: queryKeys.calibrations.overdue(defaultTeamId, defaultSite),
    queryFn: () => calibrationApi.getOverdueCalibrations(defaultTeamId, defaultSite),
    ...QUERY_CONFIG.CALIBRATION_SUMMARY,
  });

  const { data: upcomingData } = useQuery({
    queryKey: queryKeys.calibrations.upcoming(
      CALIBRATION_THRESHOLDS.CALIBRATION_WARNING_DAYS,
      defaultTeamId,
      defaultSite
    ),
    queryFn: () =>
      calibrationApi.getUpcomingCalibrations(
        CALIBRATION_THRESHOLDS.CALIBRATION_WARNING_DAYS,
        defaultTeamId,
        defaultSite
      ),
    ...QUERY_CONFIG.CALIBRATION_SUMMARY,
  });

  const historyQueryParams = useMemo(() => {
    const params: Record<string, string | undefined> = {
      teamId: defaultTeamId,
      site: defaultSite,
      calibrationDueStatus: filters.calibrationDueStatus || undefined,
    };
    // undefined 값 제거 (queryKey 안정성)
    return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined));
  }, [defaultTeamId, defaultSite, filters.calibrationDueStatus]);

  const { data: calibrationHistoryData, isLoading: isHistoryLoading } = useQuery({
    queryKey: queryKeys.calibrations.historyList(
      Object.keys(historyQueryParams).length > 0 ? historyQueryParams : undefined
    ),
    queryFn: () =>
      calibrationApi.getCalibrationHistory({
        pageSize: SELECTOR_PAGE_SIZE,
        ...historyQueryParams,
      }),
    ...QUERY_CONFIG.CALIBRATION_LIST,
  });

  const { data: teamsData } = useQuery({
    queryKey: queryKeys.teams.list(),
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.TEAMS.LIST);
      return response.data;
    },
    ...QUERY_CONFIG.TEAMS,
  });

  // ── Derived data ─────────────────────────────────────────────────────────

  const stats = {
    total: summaryData?.total ?? 0,
    compliant: (summaryData?.total ?? 0) - (summaryData?.overdueCount ?? 0),
    overdue: summaryData?.overdueCount ?? 0,
    upcoming: summaryData?.dueInMonthCount ?? 0,
  };

  // overdueData + upcomingData + historyData에서 nextCalibrationDate 있는 항목 수집 (중복 제거)
  const timelineItems = useMemo<CalibrationTimelineItem[]>(() => {
    const seen = new Set<string>();
    const result: CalibrationTimelineItem[] = [];
    const sources = [
      ...(overdueData ?? []),
      ...(upcomingData ?? []),
      ...(calibrationHistoryData?.data ?? []),
    ];
    for (const item of sources) {
      if (!seen.has(item.equipmentId) && item.nextCalibrationDate) {
        seen.add(item.equipmentId);
        result.push({
          equipmentId: item.equipmentId,
          equipmentName: item.equipmentName,
          nextCalibrationDate: item.nextCalibrationDate,
        });
      }
    }
    return result;
  }, [overdueData, upcomingData, calibrationHistoryData]);

  // 검색어 클라이언트 필터링 (server는 이미 teamId/site로 필터됨)
  const listData = useMemo(() => {
    if (!calibrationHistoryData?.data) return [];
    if (!filters.search) return calibrationHistoryData.data;
    const q = filters.search.toLowerCase();
    return calibrationHistoryData.data.filter(
      (item) =>
        item.equipmentName.toLowerCase().includes(q) ||
        item.managementNumber.toLowerCase().includes(q)
    );
  }, [calibrationHistoryData, filters.search]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={getPageContainerClasses()}>
      {/* 헤더 */}
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          canCreateCalibration ? (
            <Button onClick={() => router.push('/calibration/register')}>
              <Plus className="w-4 h-4 mr-2" />
              {t('content.registerButton')}
            </Button>
          ) : undefined
        }
      />

      {/* Alert Banner (교정기한 초과 / 30일 이내 교정 예정) */}
      <CalibrationAlertBanners
        overdue={stats.overdue}
        upcoming={stats.upcoming}
        onOverdueAction={() =>
          router.push(`${FRONTEND_ROUTES.EQUIPMENT.LIST}?status=calibration_overdue`)
        }
        onUpcomingAction={() =>
          router.push(`${FRONTEND_ROUTES.EQUIPMENT.LIST}?status=calibration_scheduled`)
        }
      />

      {/* 통계 카드 */}
      <CalibrationStatsCards stats={stats} />

      {/* 필터 바 (Compact Filter Bar — CHECKOUT_FILTER_BAR_TOKENS 대칭) */}
      <div className={CALIBRATION_FILTER_BAR.container}>
        {/* 검색 */}
        <div className="relative flex-1 min-w-[180px]">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder={t('content.search.placeholder')}
            className="pl-8 h-8 text-sm"
            value={filters.search}
            onChange={(e) => updateSearch(e.target.value)}
            aria-label={t('content.search.searchLabel')}
          />
        </div>

        <div className={CALIBRATION_FILTER_BAR.divider} aria-hidden="true" />

        {/* 사이트 필터 */}
        <Select {...siteSelect}>
          <SelectTrigger
            className="h-8 w-[120px] text-xs"
            aria-label={t('content.search.siteFilter')}
          >
            <div className="flex items-center gap-1.5">
              <Filter className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
              <SelectValue placeholder={t('content.search.siteFilter')} />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">{t('content.search.allSites')}</SelectItem>
            {Object.entries(siteLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 팀 필터 */}
        <Select {...teamSelect}>
          <SelectTrigger
            className="h-8 w-[120px] text-xs"
            aria-label={t('content.search.teamFilter')}
          >
            <div className="flex items-center gap-1.5">
              <Filter className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
              <SelectValue placeholder={t('content.search.teamFilter')} />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('content.search.allTeams')}</SelectItem>
            {teamsData?.items?.map((team: { id: string; name: string }) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 승인 상태 필터 */}
        <Select {...approvalSelect}>
          <SelectTrigger
            className="h-8 w-[120px] text-xs"
            aria-label={t('content.filters.approvalStatusLabel')}
          >
            <div className="flex items-center gap-1.5">
              <CheckSquare className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
              <SelectValue placeholder={t('content.filters.approvalStatusLabel')} />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('content.filters.approvalStatusAll')}</SelectItem>
            <SelectItem value="pending_approval">
              {t('content.filters.approvalOptions.pending_approval')}
            </SelectItem>
            <SelectItem value="approved">
              {t('content.filters.approvalOptions.approved')}
            </SelectItem>
            <SelectItem value="rejected">
              {t('content.filters.approvalOptions.rejected')}
            </SelectItem>
          </SelectContent>
        </Select>

        {/* 교정 결과 필터 */}
        <Select {...resultSelect}>
          <SelectTrigger
            className="h-8 w-[110px] text-xs"
            aria-label={t('content.filters.resultLabel')}
          >
            <div className="flex items-center gap-1.5">
              <ClipboardCheck
                className="h-3 w-3 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <SelectValue placeholder={t('content.filters.resultLabel')} />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('content.filters.resultAll')}</SelectItem>
            <SelectItem value="pass">{t('content.filters.resultOptions.pass')}</SelectItem>
            <SelectItem value="fail">{t('content.filters.resultOptions.fail')}</SelectItem>
            <SelectItem value="conditional">
              {t('content.filters.resultOptions.conditional')}
            </SelectItem>
          </SelectContent>
        </Select>

        {/* 교정 기한 상태 필터 */}
        <Select {...calibrationDueStatusSelect}>
          <SelectTrigger
            className="h-8 w-[130px] text-xs"
            aria-label={t('content.filters.calibrationDueStatusLabel')}
          >
            <div className="flex items-center gap-1.5">
              <CircleDot className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
              <SelectValue placeholder={t('content.filters.calibrationDueStatusLabel')} />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('content.filters.calibrationDueStatusAll')}</SelectItem>
            {CALIBRATION_DUE_STATUS_VALUES.map((status) => (
              <SelectItem key={status} value={status}>
                {t(`content.filters.calibrationDueStatusOptions.${status}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 활성 필터 태그 */}
        {countActiveFilters(filters) > 0 && (
          <>
            <div className={CALIBRATION_FILTER_BAR.divider} aria-hidden="true" />
            {filters.site && (
              <button
                type="button"
                className={CALIBRATION_FILTER_BAR.tag}
                onClick={() => updateSite('')}
              >
                {siteLabels[filters.site as keyof typeof siteLabels]}
                <X className={CALIBRATION_FILTER_BAR.tagDismissIcon} />
              </button>
            )}
            {filters.teamId && (
              <button
                type="button"
                className={CALIBRATION_FILTER_BAR.tag}
                onClick={() => updateTeamId('')}
              >
                {teamsData?.items?.find(
                  (t: { id: string; name: string }) => t.id === filters.teamId
                )?.name ?? filters.teamId}
                <X className={CALIBRATION_FILTER_BAR.tagDismissIcon} />
              </button>
            )}
            {filters.approvalStatus && (
              <button
                type="button"
                className={CALIBRATION_FILTER_BAR.tag}
                onClick={() => updateApprovalStatus('')}
              >
                {t(
                  `content.filters.approvalOptions.${filters.approvalStatus}` as Parameters<
                    typeof t
                  >[0]
                )}
                <X className={CALIBRATION_FILTER_BAR.tagDismissIcon} />
              </button>
            )}
            {filters.result && (
              <button
                type="button"
                className={CALIBRATION_FILTER_BAR.tag}
                onClick={() => updateResult('')}
              >
                {t(`content.filters.resultOptions.${filters.result}` as Parameters<typeof t>[0])}
                <X className={CALIBRATION_FILTER_BAR.tagDismissIcon} />
              </button>
            )}
            {filters.calibrationDueStatus && (
              <button
                type="button"
                className={CALIBRATION_FILTER_BAR.tag}
                onClick={() => updateCalibrationDueStatus('')}
              >
                {t(`content.filters.calibrationDueStatusOptions.${filters.calibrationDueStatus}`)}
                <X className={CALIBRATION_FILTER_BAR.tagDismissIcon} />
              </button>
            )}
            <button
              type="button"
              className={CALIBRATION_FILTER_BAR.resetButton}
              onClick={clearFilters}
            >
              {t('content.filters.reset')}
            </button>
          </>
        )}
      </div>

      {/* 교정 이력 */}
      <CalibrationTimeline items={timelineItems} />
      <div className="mt-4">
        <CalibrationListTable
          data={listData}
          isLoading={isHistoryLoading}
          canRegister={canCreateCalibration}
        />
      </div>
    </div>
  );
}
