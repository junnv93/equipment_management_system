'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, CheckSquare, ClipboardCheck, CircleDot, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import calibrationApi, {
  type CalibrationSummary,
  type IntermediateCheckItem,
  type IntermediateChecksResponse,
} from '@/lib/api/calibration-api';
import { apiClient } from '@/lib/api/api-client';
import { API_ENDPOINTS, SELECTOR_PAGE_SIZE } from '@equipment-management/shared-constants';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import {
  getCalibrationTabClasses,
  CALIBRATION_DIALOG,
  CALIBRATION_TAB_TRANSITION,
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
import { EquipmentStatusValues } from '@equipment-management/schemas';
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

// ✅ 탭 컴포넌트는 dynamic import: 초기 번들 제외, 사용자 인터랙션 후 로드
const TabSkeleton = () => (
  <div className="space-y-4 p-4">
    <div className="h-8 w-48 animate-pulse rounded bg-muted" />
    <div className="h-64 w-full animate-pulse rounded bg-muted" />
  </div>
);
const IntermediateChecksTab = dynamic(
  () => import('@/components/calibration/IntermediateChecksTab'),
  { ssr: false, loading: () => <TabSkeleton /> }
);
const SelfInspectionTab = dynamic(() => import('@/components/calibration/SelfInspectionTab'), {
  ssr: false,
  loading: () => <TabSkeleton />,
});

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
    updateTab,
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
  const { fmtDate } = useDateFormatter();
  const canCreateCalibration = can(Permission.CREATE_CALIBRATION);

  // 중간점검 완료 다이얼로그 상태
  const [selectedCheck, setSelectedCheck] = useState<IntermediateCheckItem | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);

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

  // ✅ Tab badge용 count만 select — IntermediateChecksTab의 동일 queryKey와 캐시 공유
  // TanStack Query deduplication: 네트워크 요청은 1회만 발생
  const { data: intermediateCount } = useQuery<IntermediateChecksResponse, Error, number>({
    queryKey: queryKeys.calibrations.intermediateChecks(defaultTeamId, defaultSite),
    queryFn: () => calibrationApi.getAllIntermediateChecks(defaultTeamId, defaultSite),
    select: (data) => data.meta?.totalItems ?? 0,
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

  // ── Mutation ─────────────────────────────────────────────────────────────

  const completeCheckMutation = useOptimisticMutation<
    unknown,
    { id: string; version: number; notes?: string },
    IntermediateChecksResponse
  >({
    mutationFn: async ({ id, version, notes }) => {
      const response = await apiClient.post(
        API_ENDPOINTS.CALIBRATIONS.INTERMEDIATE_CHECKS.COMPLETE(id),
        { notes: notes || undefined, version }
      );
      return response.data;
    },
    queryKey: queryKeys.calibrations.intermediateChecks(defaultTeamId, defaultSite),
    optimisticUpdate: (old, { id }) => {
      if (!old) return { items: [], meta: { totalItems: 0, overdueCount: 0, pendingCount: 0 } };
      return {
        ...old,
        items: old.items.filter((item) => item.id !== id),
        meta: { ...old.meta, totalItems: Math.max(0, old.meta.totalItems - 1) },
      };
    },
    invalidateKeys: [queryKeys.calibrations.all, queryKeys.notifications.all],
    successMessage: t('content.toasts.completeSuccess'),
    errorMessage: t('content.toasts.completeError'),
    onSuccessCallback: () => {
      setIsCompleteDialogOpen(false);
      setSelectedCheck(null);
      setCompletionNotes('');
    },
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
          router.push(
            `${FRONTEND_ROUTES.EQUIPMENT.LIST}?status=${EquipmentStatusValues.CALIBRATION_OVERDUE}`
          )
        }
        onUpcomingAction={() =>
          router.push(
            `${FRONTEND_ROUTES.EQUIPMENT.LIST}?status=${EquipmentStatusValues.CALIBRATION_SCHEDULED}`
          )
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

      {/* 탭 */}
      <Tabs
        value={filters.tab}
        onValueChange={(v) => updateTab(v as UICalibrationFilters['tab'])}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="list" className={getCalibrationTabClasses('list')}>
            {t('content.tabs.list')}
          </TabsTrigger>
          <TabsTrigger value="intermediate" className={getCalibrationTabClasses('intermediate')}>
            {t('content.tabs.intermediateChecks')} (
            <span className="tabular-nums">{intermediateCount ?? 0}</span>)
          </TabsTrigger>
          <TabsTrigger
            value="self-inspection"
            className={getCalibrationTabClasses('self-inspection')}
          >
            {t('content.tabs.selfInspection')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className={`mt-0 ${CALIBRATION_TAB_TRANSITION}`}>
          <CalibrationTimeline items={timelineItems} />
          <div className="mt-4">
            <CalibrationListTable
              data={listData}
              isLoading={isHistoryLoading}
              canRegister={canCreateCalibration}
            />
          </div>
        </TabsContent>

        <TabsContent value="intermediate" className={`mt-0 ${CALIBRATION_TAB_TRANSITION}`}>
          <IntermediateChecksTab
            defaultTeamId={defaultTeamId}
            defaultSite={defaultSite}
            onComplete={(check) => {
              setSelectedCheck(check);
              setIsCompleteDialogOpen(true);
            }}
            isCompleting={completeCheckMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="self-inspection" className={`mt-0 ${CALIBRATION_TAB_TRANSITION}`}>
          <SelfInspectionTab />
        </TabsContent>
      </Tabs>

      {/* 중간점검 완료 다이얼로그 */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('content.completeDialog.title')}</DialogTitle>
            <DialogDescription>
              {selectedCheck?.equipmentName
                ? t('content.completeDialog.descriptionWithName', {
                    name: selectedCheck.equipmentName,
                  })
                : t('content.completeDialog.descriptionWithId', {
                    id: selectedCheck?.equipmentId ?? '',
                  })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedCheck && (
              <div className={`p-4 ${CALIBRATION_DIALOG.infoBackground} rounded-lg space-y-2`}>
                <p className="text-sm">
                  <strong>{t('content.completeDialog.scheduledDate')}:</strong>{' '}
                  {fmtDate(selectedCheck.intermediateCheckDate)}
                </p>
                <p className="text-sm">
                  <strong>{t('content.completeDialog.agency')}:</strong>{' '}
                  {selectedCheck.calibrationAgency || '-'}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="notes">{t('content.completeDialog.notesLabel')}</Label>
              <Textarea
                id="notes"
                placeholder={t('content.completeDialog.notesPlaceholder')}
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCompleteDialogOpen(false);
                setSelectedCheck(null);
                setCompletionNotes('');
              }}
            >
              {t('content.completeDialog.cancel')}
            </Button>
            <Button
              onClick={() => {
                if (selectedCheck)
                  completeCheckMutation.mutate({
                    id: selectedCheck.id,
                    version: selectedCheck.version,
                    notes: completionNotes,
                  });
              }}
              disabled={completeCheckMutation.isPending}
            >
              {completeCheckMutation.isPending
                ? t('content.completeDialog.processing')
                : t('content.completeDialog.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
