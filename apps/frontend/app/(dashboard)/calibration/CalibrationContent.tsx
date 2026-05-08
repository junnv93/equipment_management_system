'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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
import { FilterChip } from '@/components/shared/FilterChip';
import { useTranslations } from 'next-intl';
import type { UICalibrationFilters } from '@/lib/utils/calibration-filter-utils';
import { useCalibrationFilters } from '@/hooks/use-calibration-filters';
import { useEquipment } from '@/hooks/use-equipment';
import { useFilterSelect } from '@/lib/utils/filter-select-utils';
import { countActiveFilters } from '@/lib/utils/calibration-filter-utils';
import { useSiteLabels } from '@/lib/i18n/use-enum-labels';
import { CALIBRATION_DUE_STATUS_VALUES } from '@/lib/utils/calibration-filter-utils';
import { MANAGEMENT_METHOD_VALUES, type ManagementMethod } from '@equipment-management/schemas';
import { Permission, FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { useAuth } from '@/hooks/use-auth';
import CalibrationStatsCards from '@/components/calibration/CalibrationStatsCards';
import CalibrationTimeline, {
  type CalibrationTimelineItem,
} from '@/components/calibration/CalibrationTimeline';
import CalibrationListTable from '@/components/calibration/CalibrationListTable';
import CalibrationAlertBanners from '@/components/calibration/CalibrationAlertBanners';
import MonthlyCalibrationCalendar from '@/components/calibration/MonthlyCalibrationCalendar';

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
    updateMethods,
    updateDateRange,
    clearFilters,
  } = useCalibrationFilters(initialFilters);

  const defaultTeamId = filters.teamId || initialFilters?.teamId;
  const defaultSite = filters.site || initialFilters?.site;
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight') ?? undefined;

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

  // equipmentId deep-link 활성 시 chip 표시용 별도 fetch — list가 비어있어도
  // deterministic하게 장비 정보 표시 (Gap 4 closure: list `[0]` 의존 제거).
  const equipmentDetail = useEquipment(filters.equipmentId || '');

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
    const params: Record<string, string | readonly string[] | undefined> = {
      teamId: defaultTeamId,
      site: defaultSite,
      equipmentId: filters.equipmentId || undefined,
      approvalStatus: filters.approvalStatus || undefined,
      result: filters.result || undefined,
      calibrationDueStatus: filters.calibrationDueStatus || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      // 배열 그대로 전달 — getCalibrationHistory 내부 toCsvParam이 csv 정규화
      methods: filters.methods.length > 0 ? filters.methods : undefined,
    };
    // undefined 값 제거 (queryKey 안정성)
    return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined));
  }, [
    defaultTeamId,
    defaultSite,
    filters.equipmentId,
    filters.approvalStatus,
    filters.result,
    filters.calibrationDueStatus,
    filters.startDate,
    filters.endDate,
    filters.methods,
  ]);

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
    completedThisQuarter: summaryData?.passCount ?? 0,
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
          router.push(`${FRONTEND_ROUTES.EQUIPMENT.LIST}?calibrationDueFilter=overdue`)
        }
        onUpcomingAction={() =>
          router.push(`${FRONTEND_ROUTES.EQUIPMENT.LIST}?calibrationDueFilter=due_soon`)
        }
      />

      {/* equipmentId deep-link 활성 시 chip — 사용자가 어떤 장비로 필터링 중인지 즉시 인지.
          SSOT: <FilterChip> 도메인 중립 컴포넌트 + design token 경유.
          데이터 소스: useEquipment 별도 fetch (list `[0]` 의존 제거 — Gap 4 closure). */}
      {filters.equipmentId && (
        <FilterChip
          label={t('content.filterChip.equipmentLabel')}
          value={
            equipmentDetail.data
              ? `${equipmentDetail.data.name}${
                  equipmentDetail.data.managementNumber
                    ? ` (${equipmentDetail.data.managementNumber})`
                    : ''
                }`
              : '—'
          }
          onClear={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete('equipmentId');
            const qs = params.toString();
            router.replace(
              qs ? `${FRONTEND_ROUTES.CALIBRATION.LIST}?${qs}` : FRONTEND_ROUTES.CALIBRATION.LIST
            );
          }}
          clearAriaLabel={t('content.filterChip.clearAriaLabel')}
          clearLabel={t('content.filterChip.clear')}
        />
      )}

      {/* 통계 카드 */}
      <CalibrationStatsCards stats={stats} />

      <MonthlyCalibrationCalendar
        items={timelineItems}
        selectedStartDate={filters.startDate}
        selectedEndDate={filters.endDate}
        onSelectMonth={({ startDate, endDate }) => {
          if (filters.startDate === startDate && filters.endDate === endDate) {
            updateDateRange('', '');
            return;
          }
          updateDateRange(startDate, endDate);
        }}
      />

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

        {/* 관리 방법 다중 선택 (외부교정/자체점검/비대상) — UL-QP-18 분류별 조회 */}
        <ToggleGroup
          type="multiple"
          value={[...filters.methods]}
          onValueChange={(value) => updateMethods(value as ManagementMethod[])}
          aria-label={t('content.filters.methodsLabel')}
          className="flex-wrap"
          size="sm"
          variant="outline"
        >
          {MANAGEMENT_METHOD_VALUES.map((method) => (
            <ToggleGroupItem
              key={method}
              value={method}
              aria-label={t(`content.filters.methodOptions.${method}`)}
              className="h-8 px-2 text-xs"
            >
              {t(`content.filters.methodOptions.${method}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

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
            {filters.startDate && filters.endDate && (
              <button
                type="button"
                className={CALIBRATION_FILTER_BAR.tag}
                onClick={() => updateDateRange('', '')}
              >
                {filters.startDate} ~ {filters.endDate}
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
          highlightId={highlightId}
        />
      </div>
    </div>
  );
}
