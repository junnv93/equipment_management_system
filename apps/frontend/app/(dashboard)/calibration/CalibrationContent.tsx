'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, Clock, Filter, Plus, Search, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';
import calibrationApi, { type CalibrationSummary } from '@/lib/api/calibration-api';
import { apiClient } from '@/lib/api/api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { format, differenceInDays, isBefore } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  getIntermediateCheckBadgeClasses,
  getIntermediateCheckIcon,
  getIntermediateCheckIconColor,
  getCalibrationStatusIndicatorClasses,
  CALIBRATION_STATS_TEXT,
  getCalibrationTabClasses,
  CALIBRATION_TABLE,
  CALIBRATION_EMPTY_STATE,
  CALIBRATION_DIALOG,
  CALIBRATION_CARD_BORDER,
  type IntermediateCheckStatus,
  type CalibrationStatusType,
} from '@/lib/design-tokens';

// 중간점검 데이터 타입 (CalibrationRecord SSOT 기반 + 플래튼된 조인 필드)
interface IntermediateCheckItem {
  id: string;
  equipmentId: string;
  calibrationManagerId: string;
  intermediateCheckDate: string;
  calibrationDate: string;
  nextCalibrationDate: string;
  status: string;
  calibrationAgency: string;
  notes: string | null;
  // 플래튼된 조인 필드 (백엔드에서 equipment → flat)
  equipmentName?: string;
  managementNumber?: string;
  team?: string;
  teamId?: string;
  teamName?: string;
}

interface IntermediateChecksResponse {
  items: IntermediateCheckItem[];
  meta: {
    totalItems: number;
    overdueCount: number;
    pendingCount: number;
  };
}

// 중간점검 상태별 스타일 (토큰 기반)
function getIntermediateCheckStatusStyle(
  checkDate: string,
  translate: (key: string, params?: Record<string, number>) => string
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(checkDate);
  date.setHours(0, 0, 0, 0);
  const diff = differenceInDays(date, today);

  let status: IntermediateCheckStatus;
  let text: string;

  if (diff < 0) {
    status = 'overdue';
    text = translate('content.intermediateChecks.statusText.overdue', { days: Math.abs(diff) });
  } else if (diff === 0) {
    status = 'today';
    text = translate('content.intermediateChecks.statusText.today');
  } else if (diff <= 7) {
    status = 'upcoming';
    text = `D-${diff}`;
  } else {
    status = 'future';
    text = `D-${diff}`;
  }

  return {
    badge: getIntermediateCheckBadgeClasses(status),
    icon: getIntermediateCheckIcon(status),
    iconColor: getIntermediateCheckIconColor(status),
    text,
    status,
  };
}

import { useTranslations } from 'next-intl';
import type { UICalibrationFilters } from '@/lib/utils/calibration-filter-utils';
import { useCalibrationFilters } from '@/hooks/use-calibration-filters';

interface CalibrationContentProps {
  initialSummary?: CalibrationSummary;
  initialFilters?: UICalibrationFilters;
}

export default function CalibrationContent({
  initialSummary,
  initialFilters,
}: CalibrationContentProps) {
  const t = useTranslations('calibration');
  // SSOT 패턴: URL-driven 필터 훅 사용
  const { filters, updateSearch, updateTeamId } = useCalibrationFilters(initialFilters);
  const defaultTeamId = filters.teamId || initialFilters?.teamId;
  const defaultSite = filters.site || initialFilters?.site;
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState('all');
  const [selectedIntermediateCheck, setSelectedIntermediateCheck] =
    useState<IntermediateCheckItem | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);

  // 교정 요약 통계 조회 (역할별 필터 적용)
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: queryKeys.calibrations.summary(defaultTeamId, defaultSite),
    queryFn: () => calibrationApi.getCalibrationSummary(defaultTeamId, defaultSite),
    placeholderData: initialSummary,
    ...QUERY_CONFIG.CALIBRATION_SUMMARY,
  });

  // 교정 기한 초과 장비 조회
  const { data: overdueData, isLoading: isOverdueLoading } = useQuery({
    queryKey: queryKeys.calibrations.overdue(defaultTeamId, defaultSite),
    queryFn: () => calibrationApi.getOverdueCalibrations(defaultTeamId, defaultSite),
    ...QUERY_CONFIG.CALIBRATION_SUMMARY,
  });

  // 30일 이내 교정 예정 장비 조회
  const { data: upcomingData, isLoading: isUpcomingLoading } = useQuery({
    queryKey: queryKeys.calibrations.upcoming(30, defaultTeamId, defaultSite),
    queryFn: () => calibrationApi.getUpcomingCalibrations(30, defaultTeamId, defaultSite),
    ...QUERY_CONFIG.CALIBRATION_SUMMARY,
  });

  // 모든 교정 이력 조회 (teamId/site 필터 적용)
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

  // 전체 중간점검 목록 조회 (teamId/site 필터 적용)
  const { data: intermediateChecksData, isLoading: isIntermediateChecksLoading } =
    useQuery<IntermediateChecksResponse>({
      queryKey: queryKeys.calibrations.intermediateChecks(defaultTeamId, defaultSite),
      queryFn: async () => {
        const params = new URLSearchParams();
        if (defaultTeamId) params.set('teamId', defaultTeamId);
        if (defaultSite) params.set('site', defaultSite);
        const qs = params.toString();
        const url = `${API_ENDPOINTS.CALIBRATIONS.INTERMEDIATE_CHECKS.ALL}${qs ? `?${qs}` : ''}`;
        const response = await apiClient.get(url);
        return response.data;
      },
      ...QUERY_CONFIG.CALIBRATION_LIST,
    });

  // 팀 목록 조회 (동적 로딩)
  const { data: teamsData, isLoading: isTeamsLoading } = useQuery({
    queryKey: queryKeys.teams.list(),
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.TEAMS.LIST);
      return response.data;
    },
    ...QUERY_CONFIG.TEAMS,
  });

  // 중간점검 완료 뮤테이션
  const completeIntermediateCheckMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      // ✅ completedBy는 백엔드에서 JWT 세션 추출 (Rule 2)
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
      setSelectedIntermediateCheck(null);
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
      // ✅ calibrations.all prefix로 broad invalidation (SSOT: onSettled에서 서버 동기화)
      queryClient.invalidateQueries({ queryKey: queryKeys.calibrations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const handleIntermediateCheckComplete = (check: IntermediateCheckItem) => {
    setSelectedIntermediateCheck(check);
    setIsCompleteDialogOpen(true);
  };

  const handleConfirmComplete = () => {
    if (!selectedIntermediateCheck) return;
    completeIntermediateCheckMutation.mutate({
      id: selectedIntermediateCheck.id,
      notes: completionNotes,
    });
  };

  // 로딩 상태 통합
  const isLoading =
    isSummaryLoading ||
    isOverdueLoading ||
    isUpcomingLoading ||
    isHistoryLoading ||
    isIntermediateChecksLoading ||
    isTeamsLoading;

  // 데이터 연결 상태 확인
  const isError = !summaryData && !overdueData && !upcomingData && !calibrationHistoryData;

  // 교정 데이터 준비
  const getFilteredCalibrationData = () => {
    if (currentTab === 'overdue' && overdueData) {
      return overdueData.filter(
        (item) =>
          (!filters.search ||
            item.equipmentName.toLowerCase().includes(filters.search.toLowerCase()) ||
            item.managementNumber.toLowerCase().includes(filters.search.toLowerCase())) &&
          (!filters.teamId || item.teamId === filters.teamId)
      );
    }

    if (currentTab === 'upcoming' && upcomingData) {
      return upcomingData.filter(
        (item) =>
          (!filters.search ||
            item.equipmentName.toLowerCase().includes(filters.search.toLowerCase()) ||
            item.managementNumber.toLowerCase().includes(filters.search.toLowerCase())) &&
          (!filters.teamId || item.teamId === filters.teamId)
      );
    }

    // 전체 탭인 경우 모든 교정 이력
    if (calibrationHistoryData?.data) {
      return calibrationHistoryData.data.filter(
        (item) =>
          (!filters.search ||
            item.equipmentName.toLowerCase().includes(filters.search.toLowerCase()) ||
            item.managementNumber.toLowerCase().includes(filters.search.toLowerCase())) &&
          (!filters.teamId || item.teamId === filters.teamId)
      );
    }

    return [];
  };

  const calibrationData = getFilteredCalibrationData();

  // 요약 통계
  const stats = {
    total: summaryData?.total || 0,
    compliant: (summaryData?.total || 0) - (summaryData?.overdueCount || 0),
    overdue: summaryData?.overdueCount || 0,
    upcoming: summaryData?.dueInMonthCount || 0,
  };

  // 날짜 형식 변환
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'yyyy-MM-dd');
  };

  // 교정 상태 계산
  const getCalibrationStatus = (nextCalibrationDate: string | null | undefined) => {
    if (!nextCalibrationDate) return { status: 'none', text: t('content.statusText.none') };

    const today = new Date();
    const nextDate = new Date(nextCalibrationDate);

    if (isBefore(nextDate, today)) {
      return { status: 'overdue', text: t('content.statusText.overdue') };
    }

    const daysRemaining = differenceInDays(nextDate, today);
    if (daysRemaining <= 30) {
      return {
        status: 'upcoming',
        text: t('content.statusText.upcoming', { days: daysRemaining }),
      };
    }

    return { status: 'ok', text: t('content.statusText.ok') };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Button onClick={() => router.push('/calibration/register')}>
          <Plus className="w-4 h-4 mr-2" />
          {t('content.registerButton')}
        </Button>
      </div>

      {/* 교정 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('content.stats.total')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold tabular-nums ${CALIBRATION_STATS_TEXT.total}`}>
              {t('content.stats.unit', { count: stats.total })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('content.stats.compliant')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold tabular-nums ${CALIBRATION_STATS_TEXT.compliant}`}>
              {t('content.stats.unit', { count: stats.compliant })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('content.stats.overdue')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold tabular-nums ${CALIBRATION_STATS_TEXT.overdue}`}>
              {t('content.stats.unit', { count: stats.overdue })}
            </div>
          </CardContent>
          {stats.overdue > 0 && (
            <CardFooter className="pt-0">
              <Link
                href="#"
                className={`text-xs ${CALIBRATION_STATS_TEXT.overdue} ${CALIBRATION_TABLE.link}`}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentTab('overdue');
                }}
              >
                {t('content.stats.viewDetails')}
              </Link>
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('content.stats.upcoming')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold tabular-nums ${CALIBRATION_STATS_TEXT.upcoming}`}>
              {t('content.stats.unit', { count: stats.upcoming })}
            </div>
          </CardContent>
          {stats.upcoming > 0 && (
            <CardFooter className="pt-0">
              <Link
                href="#"
                className={`text-xs ${CALIBRATION_STATS_TEXT.upcoming} ${CALIBRATION_TABLE.link}`}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentTab('upcoming');
                }}
              >
                {t('content.stats.viewDetails')}
              </Link>
            </CardFooter>
          )}
        </Card>
      </div>

      {/* 필터링 및 검색 */}
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
              {/* ✅ 동적으로 로드된 팀 데이터 사용 (teams API: { items: [...] }) */}
              {teamsData?.items?.map((team: { id: string; name: string }) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 탭 및 장비 목록 */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all" className={getCalibrationTabClasses('all')}>
            {t('content.tabs.all')}
          </TabsTrigger>
          <TabsTrigger value="overdue" className={getCalibrationTabClasses('overdue')}>
            {t('content.tabs.overdue')}
          </TabsTrigger>
          <TabsTrigger value="upcoming" className={getCalibrationTabClasses('upcoming')}>
            {t('content.tabs.upcoming')}
          </TabsTrigger>
          <TabsTrigger
            value="intermediate-checks"
            className={getCalibrationTabClasses('intermediate')}
          >
            {t('content.tabs.intermediateChecks')} (
            <span className="tabular-nums">{intermediateChecksData?.meta?.totalItems || 0}</span>)
          </TabsTrigger>
        </TabsList>

        <TabsContent value={currentTab} className="mt-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <p>{t('content.loading')}</p>
            </div>
          ) : isError ? (
            <div className="flex justify-center py-8 text-destructive">
              <p>{t('content.error')}</p>
            </div>
          ) : calibrationData.length === 0 ? (
            <div className={CALIBRATION_EMPTY_STATE.container}>
              <CalendarDays className={CALIBRATION_EMPTY_STATE.icon} />
              <h3 className={CALIBRATION_EMPTY_STATE.title}>{t('content.empty.title')}</h3>
              <p className={CALIBRATION_EMPTY_STATE.description}>
                {currentTab === 'all'
                  ? t('content.empty.all')
                  : currentTab === 'overdue'
                    ? t('content.empty.overdue')
                    : t('content.empty.upcoming')}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/calibration/register')}
              >
                {t('content.empty.registerButton')}
              </Button>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('content.table.equipmentName')}</TableHead>
                    <TableHead>{t('content.table.managementNumber')}</TableHead>
                    <TableHead>{t('content.table.team')}</TableHead>
                    <TableHead>{t('content.table.calibrationDate')}</TableHead>
                    <TableHead>{t('content.table.nextCalibrationDate')}</TableHead>
                    <TableHead>{t('content.table.calibrationAgency')}</TableHead>
                    <TableHead>{t('content.table.status')}</TableHead>
                    <TableHead className="text-right">{t('content.table.action')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calibrationData.map((item) => {
                    const calibrationStatus = getCalibrationStatus(item.nextCalibrationDate);
                    const { dot, text: textColor } = getCalibrationStatusIndicatorClasses(
                      calibrationStatus.status as CalibrationStatusType
                    );
                    return (
                      <TableRow key={item.id} className={CALIBRATION_TABLE.rowHover}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/equipment/${item.equipmentId}`}
                            className={CALIBRATION_TABLE.link}
                          >
                            {item.equipmentName}
                          </Link>
                        </TableCell>
                        <TableCell className={CALIBRATION_TABLE.numericColumn}>
                          {item.managementNumber}
                        </TableCell>
                        <TableCell>{item.teamName || item.team || '-'}</TableCell>
                        <TableCell className={CALIBRATION_TABLE.numericColumn}>
                          {formatDate(item.calibrationDate)}
                        </TableCell>
                        <TableCell className={CALIBRATION_TABLE.numericColumn}>
                          {formatDate(item.nextCalibrationDate)}
                        </TableCell>
                        <TableCell>{item.calibrationAgency}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${dot}`} />
                            <span className={textColor}>{calibrationStatus.text}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/calibration/register?equipmentId=${item.equipmentId}`)
                            }
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            {t('content.table.registerCalibration')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* 중간점검 탭 내용 */}
        <TabsContent value="intermediate-checks" className="mt-0">
          {isIntermediateChecksLoading ? (
            <div className="flex justify-center py-8">
              <p>{t('content.loading')}</p>
            </div>
          ) : !intermediateChecksData?.items?.length ? (
            <div className={CALIBRATION_EMPTY_STATE.container}>
              <CheckCircle2 className={CALIBRATION_EMPTY_STATE.icon} />
              <h3 className={CALIBRATION_EMPTY_STATE.title}>
                {t('content.intermediateChecks.empty.title')}
              </h3>
              <p className={CALIBRATION_EMPTY_STATE.description}>
                {t('content.intermediateChecks.empty.description')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 중간점검 요약 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {t('content.intermediateChecks.stats.total')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tabular-nums">
                      {t('content.intermediateChecks.stats.unit', {
                        count: intermediateChecksData.meta.totalItems,
                      })}
                    </div>
                  </CardContent>
                </Card>
                <Card className={CALIBRATION_CARD_BORDER.overdue}>
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-sm font-medium ${CALIBRATION_STATS_TEXT.overdue}`}>
                      {t('content.intermediateChecks.stats.overdue')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold tabular-nums ${CALIBRATION_STATS_TEXT.overdue}`}
                    >
                      {t('content.intermediateChecks.stats.unit', {
                        count: intermediateChecksData.meta.overdueCount,
                      })}
                    </div>
                  </CardContent>
                </Card>
                <Card className={CALIBRATION_CARD_BORDER.pending}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-ul-blue dark:text-blue-400">
                      {t('content.intermediateChecks.stats.pending')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tabular-nums text-ul-blue dark:text-blue-400">
                      {t('content.intermediateChecks.stats.unit', {
                        count: intermediateChecksData.meta.pendingCount,
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 중간점검 목록 테이블 */}
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('content.intermediateChecks.table.status')}</TableHead>
                      <TableHead>{t('content.intermediateChecks.table.checkDate')}</TableHead>
                      <TableHead>{t('content.intermediateChecks.table.equipmentName')}</TableHead>
                      <TableHead>
                        {t('content.intermediateChecks.table.managementNumber')}
                      </TableHead>
                      <TableHead>{t('content.intermediateChecks.table.team')}</TableHead>
                      <TableHead>
                        {t('content.intermediateChecks.table.nextCalibrationDate')}
                      </TableHead>
                      <TableHead className="text-right">
                        {t('content.intermediateChecks.table.action')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {intermediateChecksData.items.map((check) => {
                      const style = getIntermediateCheckStatusStyle(check.intermediateCheckDate, t);
                      const IconComponent = style.icon;
                      return (
                        <TableRow key={check.id} className={CALIBRATION_TABLE.rowHover}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <IconComponent className={`h-4 w-4 ${style.iconColor}`} />
                              <Badge className={style.badge}>{style.text}</Badge>
                            </div>
                          </TableCell>
                          <TableCell className={CALIBRATION_TABLE.numericColumn}>
                            {format(new Date(check.intermediateCheckDate), 'yyyy-MM-dd', {
                              locale: ko,
                            })}
                          </TableCell>
                          <TableCell className="font-medium">
                            {check.equipmentName ? (
                              <Link
                                href={`/equipment/${check.equipmentId}`}
                                className={CALIBRATION_TABLE.link}
                              >
                                {check.equipmentName}
                              </Link>
                            ) : (
                              <span className="font-mono text-sm text-muted-foreground">
                                {check.equipmentId.substring(0, 8)}...
                              </span>
                            )}
                          </TableCell>
                          <TableCell className={CALIBRATION_TABLE.numericColumn}>
                            {check.managementNumber || '-'}
                          </TableCell>
                          <TableCell>{check.teamName || check.team || '-'}</TableCell>
                          <TableCell className={CALIBRATION_TABLE.numericColumn}>
                            {format(new Date(check.nextCalibrationDate), 'yyyy-MM-dd', {
                              locale: ko,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => handleIntermediateCheckComplete(check)}
                              disabled={completeIntermediateCheckMutation.isPending}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              {t('content.intermediateChecks.table.complete')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 중간점검 완료 다이얼로그 */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('content.completeDialog.title')}</DialogTitle>
            <DialogDescription>
              {selectedIntermediateCheck?.equipmentName
                ? t('content.completeDialog.descriptionWithName', {
                    name: selectedIntermediateCheck.equipmentName,
                  })
                : t('content.completeDialog.descriptionWithId', {
                    id: selectedIntermediateCheck?.equipmentId ?? '',
                  })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedIntermediateCheck && (
              <div className={`p-4 ${CALIBRATION_DIALOG.infoBackground} rounded-lg space-y-2`}>
                <p className="text-sm">
                  <strong>{t('content.completeDialog.scheduledDate')}:</strong>{' '}
                  {format(
                    new Date(selectedIntermediateCheck.intermediateCheckDate),
                    'yyyy년 M월 d일',
                    {
                      locale: ko,
                    }
                  )}
                </p>
                <p className="text-sm">
                  <strong>{t('content.completeDialog.agency')}:</strong>{' '}
                  {selectedIntermediateCheck.calibrationAgency || '-'}
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
                setSelectedIntermediateCheck(null);
                setCompletionNotes('');
              }}
            >
              {t('content.completeDialog.cancel')}
            </Button>
            <Button
              onClick={handleConfirmComplete}
              disabled={completeIntermediateCheckMutation.isPending}
            >
              {completeIntermediateCheckMutation.isPending
                ? t('content.completeDialog.processing')
                : t('content.completeDialog.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
