'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter } from 'lucide-react';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';
import calibrationApi, {
  type CalibrationSummary,
  type IntermediateCheckItem,
  type IntermediateChecksResponse,
} from '@/lib/api/calibration-api';
import { apiClient } from '@/lib/api/api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  getCalibrationTabClasses,
  CALIBRATION_DIALOG,
  CALIBRATION_TAB_TRANSITION,
} from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';
import type { UICalibrationFilters } from '@/lib/utils/calibration-filter-utils';
import { useCalibrationFilters } from '@/hooks/use-calibration-filters';
import CalibrationStatsCards from '@/components/calibration/CalibrationStatsCards';
import CalibrationTimeline, {
  type CalibrationTimelineItem,
} from '@/components/calibration/CalibrationTimeline';
import CalibrationListTable from '@/components/calibration/CalibrationListTable';

// ✅ 탭 컴포넌트는 dynamic import: 초기 번들 제외, 사용자 인터랙션 후 로드
const IntermediateChecksTab = dynamic(
  () => import('@/components/calibration/IntermediateChecksTab'),
  { ssr: false }
);
const SelfInspectionTab = dynamic(() => import('@/components/calibration/SelfInspectionTab'), {
  ssr: false,
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
  const { filters, updateSearch, updateTeamId, updateTab } = useCalibrationFilters(initialFilters);
  const defaultTeamId = filters.teamId || initialFilters?.teamId;
  const defaultSite = filters.site || initialFilters?.site;
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    queryKey: queryKeys.calibrations.upcoming(30, defaultTeamId, defaultSite),
    queryFn: () => calibrationApi.getUpcomingCalibrations(30, defaultTeamId, defaultSite),
    ...QUERY_CONFIG.CALIBRATION_SUMMARY,
  });

  const { data: calibrationHistoryData, isLoading: isHistoryLoading } = useQuery({
    queryKey: queryKeys.calibrations.historyList(
      defaultTeamId || defaultSite ? { teamId: defaultTeamId, site: defaultSite } : undefined
    ),
    queryFn: () =>
      calibrationApi.getCalibrationHistory({
        pageSize: 100,
        teamId: defaultTeamId,
        site: defaultSite,
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

  const completeCheckMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const response = await apiClient.post(
        API_ENDPOINTS.CALIBRATIONS.INTERMEDIATE_CHECKS.COMPLETE(id),
        { notes: notes || undefined }
      );
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: t('content.toasts.completeSuccess'),
        description: t('content.toasts.completeSuccessDesc'),
      });
      setIsCompleteDialogOpen(false);
      setSelectedCheck(null);
      setCompletionNotes('');
    },
    onError: (error: unknown) => {
      toast({
        title: t('content.toasts.completeError'),
        description: getErrorMessage(error, t('content.toasts.completeError')),
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calibrations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
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
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Button onClick={() => router.push('/calibration/register')}>
          <Plus className="w-4 h-4 mr-2" />
          {t('content.registerButton')}
        </Button>
      </div>

      {/* 통계 카드 */}
      <CalibrationStatsCards stats={stats} />

      {/* 검색 및 팀 필터 */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('content.search.placeholder')}
            className="pl-8"
            value={filters.search}
            onChange={(e) => updateSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center w-full md:w-64 space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filters.teamId || 'all'}
            onValueChange={(v) => updateTeamId(v === 'all' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('content.search.teamFilter')} />
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
        </div>
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
            <CalibrationListTable data={listData} isLoading={isHistoryLoading} />
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
                  {format(new Date(selectedCheck.intermediateCheckDate), 'yyyy년 M월 d일', {
                    locale: ko,
                  })}
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
                  completeCheckMutation.mutate({ id: selectedCheck.id, notes: completionNotes });
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
