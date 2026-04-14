'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format, parseISO } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useGenerateReport, ReportGenerationResult } from '@/hooks/use-reports';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { ReportType, ReportFormat, ReportPeriod } from '@/lib/api/reports-api';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  FileText,
  Download,
  Calendar,
  BarChart,
  Clipboard,
  FileSpreadsheet,
  FileText as FileCSV,
  File,
  CheckCircle2,
} from 'lucide-react';
import {
  REPORTS_HEADER_TOKENS,
  REPORTS_SUCCESS_BANNER_TOKENS,
  REPORTS_SUMMARY_TOKENS,
  REPORTS_CONTENT_LIST_TOKENS,
  REPORTS_EMPTY_STATE_TOKENS,
  REPORTS_LAYOUT_TOKENS,
  REPORTS_SPINNER_TOKENS,
  REPORTS_ICON_TOKENS,
  getPageContainerClasses,
} from '@/lib/design-tokens';
import { SITE_VALUES, type Site } from '@equipment-management/schemas';
import { useSiteLabels } from '@/lib/i18n/use-enum-labels';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import teamsApi, { type Team } from '@/lib/api/teams-api';
import { ReportsStatsSection } from '@/components/reports/ReportsStatsSection';
import { useReportsFilters } from '@/hooks/use-reports-filters';
import {
  ALL_SENTINEL,
  convertFiltersToApiParams,
  type UIReportsFilters,
  type ReportCalibrationStatus,
} from '@/lib/utils/reports-filter-utils';

const toSelectValue = (v: string) => (v === '' ? ALL_SENTINEL : v);
const fromSelectValue = (v: string) => (v === ALL_SENTINEL ? '' : v);

interface ReportsContentProps {
  /**
   * Server Component에서 URL searchParams로부터 파싱한 초기 필터 (URL SSOT).
   *
   * ⚠️ 현재 클라이언트는 useSearchParams() 를 통해 URL을 직접 읽으므로 prop 자체는
   * 사용되지 않는다. calibration / equipment 등 기존 페이지와 동일한 시그니처 컨벤션을
   * 유지하기 위해 prop은 받아두며, 향후 SSR 초기 데이터 fetch (예: 통계 사전 로드)
   * 가 추가되면 그때 hook 초기값으로 주입할 수 있다.
   */
  initialFilters: UIReportsFilters;
}

export default function ReportsContent(_props: ReportsContentProps) {
  const { toast } = useToast();
  const t = useTranslations('common');
  const { fmtDate } = useDateFormatter();
  const siteLabels = useSiteLabels();

  // ✅ URL SSOT — 필터 상태는 URL searchParams에서만 읽고 router.replace로 갱신
  const { filters, updateFilters } = useReportsFilters();
  const { reportType, dateRange, reportFormat, site, teamId, status } = filters;

  // customDateRange는 URL의 ISO 문자열을 Date 객체로 역직렬화
  const customDateRange: DateRange | undefined = useMemo(() => {
    if (!filters.customDateFrom && !filters.customDateTo) return undefined;
    // parseISO: yyyy-MM-dd → 로컬 자정 (KST). new Date('yyyy-MM-dd')는 UTC 자정으로
    // 파싱되어 KST 표시 시 하루 전으로 보이는 회귀를 방지.
    return {
      from: filters.customDateFrom ? parseISO(filters.customDateFrom) : undefined,
      to: filters.customDateTo ? parseISO(filters.customDateTo) : undefined,
    };
  }, [filters.customDateFrom, filters.customDateTo]);

  const setCustomDateRange = (next: DateRange | undefined) => {
    updateFilters({
      customDateFrom: next?.from ? format(next.from, 'yyyy-MM-dd') : '',
      customDateTo: next?.to ? format(next.to, 'yyyy-MM-dd') : '',
    });
  };

  // lastGeneratedReport는 일회성 mutation 결과(필터 아님) → useState 유지
  const [lastGeneratedReport, setLastGeneratedReport] = useState<ReportGenerationResult | null>(
    null
  );

  // 사이트 선택 시 해당 사이트의 팀 목록 조회
  const needsTeamFilter = reportType === 'team_equipment' || reportType === 'equipment_inventory';
  const { data: teamsData } = useQuery({
    queryKey: queryKeys.teams.bySite(site || undefined),
    queryFn: () => teamsApi.getTeams({ site: (site as Site) || undefined, pageSize: 100 }),
    enabled: needsTeamFilter,
    staleTime: CACHE_TIMES.REFERENCE,
  });
  const teams: Team[] = teamsData?.data ?? [];

  const { mutate: generateReportMutation, isPending } = useGenerateReport({
    onSuccess: (data) => {
      toast({
        title: t('reports.generateComplete'),
        description: t('reports.fileDownloaded', { fileName: data.fileName }),
      });
      setLastGeneratedReport(data);
    },
    onError: (error: unknown) => {
      toast({
        title: t('reports.generateError'),
        description: getErrorMessage(error, t('reports.generateErrorDesc')),
        variant: 'destructive',
      });
    },
  });

  const handleGenerateReport = () => {
    if (!reportType) {
      toast({
        title: t('reports.reportTypeRequired'),
        description: t('reports.reportTypeRequiredDesc'),
        variant: 'destructive',
      });
      return;
    }

    if (dateRange === 'custom' && (!customDateRange?.from || !customDateRange?.to)) {
      toast({
        title: t('reports.dateRangeRequired'),
        description: t('reports.dateRangeRequiredDesc'),
        variant: 'destructive',
      });
      return;
    }

    // SSOT: 필터-API 파라미터 변환은 convertFiltersToApiParams에 위임.
    // handleReportTypeChange가 관련없는 필드를 이미 reset하므로
    // reportType별 조건 분기 없이 설정된 필드만 자연스럽게 전달됨.
    const { startDate, endDate, ...subFilters } = convertFiltersToApiParams(filters);
    const additionalParams = subFilters as Record<string, string>;

    generateReportMutation({
      reportType: reportType as ReportType,
      format: reportFormat,
      dateRange,
      startDate,
      endDate,
      additionalParams,
    });
  };

  const handleSiteChange = (value: string) => {
    // 사이트 변경 시 팀 선택 초기화
    updateFilters({ site: fromSelectValue(value) as UIReportsFilters['site'], teamId: '' });
  };

  const handleReportTypeChange = (value: string) => {
    updateFilters({
      reportType: value as ReportType,
      site: '',
      teamId: '',
      status: '',
    });
  };

  const getReportTypeLabel = (type: ReportType) => {
    return t(`reports.types.${type}` as Parameters<typeof t>[0]);
  };

  const getReportIcon = (type: ReportType) => {
    const ic = REPORTS_ICON_TOKENS.inline;
    switch (type) {
      case 'equipment_inventory':
        return <FileText className={ic} />;
      case 'calibration_status':
        return <Clipboard className={ic} />;
      case 'utilization_report':
        return <BarChart className={ic} />;
      case 'team_equipment':
        return <FileText className={ic} />;
      case 'maintenance_report':
        return <Clipboard className={ic} />;
      default:
        return <FileText className={ic} />;
    }
  };

  const getReportDescription = (type: ReportType) => {
    return t(`reports.descriptions.${type}` as Parameters<typeof t>[0]);
  };

  const getFormatIcon = (fmt: ReportFormat) => {
    const ic = REPORTS_ICON_TOKENS.inline;
    switch (fmt) {
      case 'excel':
        return <FileSpreadsheet className={ic} />;
      case 'csv':
        return <FileCSV className={ic} />;
      case 'pdf':
        return <File className={ic} />;
      default:
        return <FileText className={ic} />;
    }
  };

  const getPeriodLabel = (period: ReportPeriod) => {
    switch (period) {
      case 'last_week':
        return t('reports.lastWeek');
      case 'last_month':
        return t('reports.lastMonth');
      case 'last_quarter':
        return t('reports.lastQuarter');
      case 'last_year':
        return t('reports.lastYear');
      case 'custom':
        return customDateRange?.from && customDateRange?.to
          ? `${fmtDate(customDateRange.from, 'PPP')} - ${fmtDate(customDateRange.to, 'PPP')}`
          : t('reports.custom');
      default:
        return '';
    }
  };

  const getCalibrationStatusLabel = (s: string) => {
    switch (s) {
      case 'completed':
        return t('reports.completed');
      case 'scheduled':
        return t('reports.scheduled');
      case 'overdue':
        return t('reports.overdue');
      default:
        return s;
    }
  };

  const getReportContents = (type: ReportType): string[] => {
    const key = `reports.contents.${type}` as Parameters<typeof t>[0];
    const contents = t.raw(key);
    return Array.isArray(contents) ? (contents as string[]) : [];
  };

  const selectedTeamName = teams.find((team) => team.id === teamId)?.name;

  return (
    <div className={getPageContainerClasses()}>
      <div className={REPORTS_HEADER_TOKENS.container}>
        <div>
          <h1 className={REPORTS_HEADER_TOKENS.title}>{t('reports.title')}</h1>
          <p className={REPORTS_HEADER_TOKENS.subtitle}>{t('reports.subtitle')}</p>
        </div>
      </div>

      {/* 통계 요약 카드 */}
      <ReportsStatsSection />

      {lastGeneratedReport && (
        <div className={REPORTS_SUCCESS_BANNER_TOKENS.container}>
          <CheckCircle2 className={REPORTS_SUCCESS_BANNER_TOKENS.icon} />
          <div>
            <h4 className={REPORTS_SUCCESS_BANNER_TOKENS.title}>{t('reports.generateComplete')}</h4>
            <p>{t('reports.fileDownloaded', { fileName: lastGeneratedReport.fileName })}</p>
          </div>
        </div>
      )}

      <div className={REPORTS_LAYOUT_TOKENS.grid}>
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.generate')}</CardTitle>
            <CardDescription>{t('reports.generateOptions')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="report-type">{t('reports.reportType')}</Label>
                <Select value={reportType} onValueChange={handleReportTypeChange}>
                  <SelectTrigger id="report-type">
                    <SelectValue placeholder={t('reports.reportTypePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equipment_inventory">
                      <div className="flex items-center">
                        <FileText className={REPORTS_ICON_TOKENS.inline} />
                        {t('reports.types.equipment_inventory')}
                      </div>
                    </SelectItem>
                    <SelectItem value="calibration_status">
                      <div className="flex items-center">
                        <Clipboard className={REPORTS_ICON_TOKENS.inline} />
                        {t('reports.types.calibration_status')}
                      </div>
                    </SelectItem>
                    <SelectItem value="utilization_report">
                      <div className="flex items-center">
                        <BarChart className={REPORTS_ICON_TOKENS.inline} />
                        {t('reports.types.utilization_report')}
                      </div>
                    </SelectItem>
                    <SelectItem value="team_equipment">
                      <div className="flex items-center">
                        <FileText className={REPORTS_ICON_TOKENS.inline} />
                        {t('reports.types.team_equipment')}
                      </div>
                    </SelectItem>
                    <SelectItem value="maintenance_report">
                      <div className="flex items-center">
                        <Clipboard className={REPORTS_ICON_TOKENS.inline} />
                        {t('reports.types.maintenance_report')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* 장비 현황: 사이트 + 팀 필터 */}
              {reportType === 'equipment_inventory' && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="site-filter">{t('reports.site')}</Label>
                    <Select value={toSelectValue(site)} onValueChange={handleSiteChange}>
                      <SelectTrigger id="site-filter">
                        <SelectValue placeholder={t('reports.allSites')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_SENTINEL}>{t('reports.allSites')}</SelectItem>
                        {SITE_VALUES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {siteLabels[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="team-filter">{t('reports.team')}</Label>
                    <Select
                      value={toSelectValue(teamId)}
                      onValueChange={(v) => updateFilters({ teamId: fromSelectValue(v) })}
                      disabled={teams.length === 0}
                    >
                      <SelectTrigger id="team-filter">
                        <SelectValue placeholder={t('reports.allTeams')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_SENTINEL}>{t('reports.allTeams')}</SelectItem>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* 교정 현황: 교정 상태 필터 */}
              {reportType === 'calibration_status' && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="calibration-status">
                      {t('reports.calibrationStatusLabel')}
                    </Label>
                    <Select
                      value={toSelectValue(status)}
                      onValueChange={(v) =>
                        updateFilters({
                          status: fromSelectValue(v) as ReportCalibrationStatus | '',
                        })
                      }
                    >
                      <SelectTrigger id="calibration-status">
                        <SelectValue placeholder={t('reports.allStatuses')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_SENTINEL}>{t('reports.allStatuses')}</SelectItem>
                        <SelectItem value="completed">{t('reports.completed')}</SelectItem>
                        <SelectItem value="scheduled">{t('reports.scheduled')}</SelectItem>
                        <SelectItem value="overdue">{t('reports.overdue')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* 활용률: 사이트 필터 */}
              {reportType === 'utilization_report' && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="site-filter-util">{t('reports.site')}</Label>
                    <Select
                      value={toSelectValue(site)}
                      onValueChange={(v) =>
                        updateFilters({ site: fromSelectValue(v) as UIReportsFilters['site'] })
                      }
                    >
                      <SelectTrigger id="site-filter-util">
                        <SelectValue placeholder={t('reports.allSites')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_SENTINEL}>{t('reports.allSites')}</SelectItem>
                        {SITE_VALUES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {siteLabels[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* 팀별 장비: 사이트 + 팀 필터 */}
              {reportType === 'team_equipment' && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="site-filter-team">{t('reports.site')}</Label>
                    <Select value={toSelectValue(site)} onValueChange={handleSiteChange}>
                      <SelectTrigger id="site-filter-team">
                        <SelectValue placeholder={t('reports.allSites')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_SENTINEL}>{t('reports.allSites')}</SelectItem>
                        {SITE_VALUES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {siteLabels[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="team-filter-team">{t('reports.team')}</Label>
                    <Select
                      value={toSelectValue(teamId)}
                      onValueChange={(v) => updateFilters({ teamId: fromSelectValue(v) })}
                      disabled={teams.length === 0}
                    >
                      <SelectTrigger id="team-filter-team">
                        <SelectValue placeholder={t('reports.allTeams')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_SENTINEL}>{t('reports.allTeams')}</SelectItem>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid gap-3">
                <Label>{t('reports.periodSelect')}</Label>
                <Select
                  value={dateRange}
                  onValueChange={(value) => updateFilters({ dateRange: value as ReportPeriod })}
                >
                  <SelectTrigger>
                    <div className="flex items-center">
                      <Calendar className={REPORTS_ICON_TOKENS.inline} />
                      <SelectValue placeholder={t('reports.periodSelect')} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last_week">{t('reports.lastWeek')}</SelectItem>
                    <SelectItem value="last_month">{t('reports.lastMonth')}</SelectItem>
                    <SelectItem value="last_quarter">{t('reports.lastQuarter')}</SelectItem>
                    <SelectItem value="last_year">{t('reports.lastYear')}</SelectItem>
                    <SelectItem value="custom">{t('reports.custom')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateRange === 'custom' && (
                <div className="grid gap-3">
                  <Label>{t('reports.customDateRange')}</Label>
                  <DatePickerWithRange date={customDateRange} setDate={setCustomDateRange} />
                </div>
              )}

              <Separator />

              <div className="grid gap-3">
                <Label>{t('reports.outputFormat')}</Label>
                <RadioGroup
                  defaultValue={reportFormat}
                  onValueChange={(value) => updateFilters({ reportFormat: value as ReportFormat })}
                  className="flex items-center space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="excel" id="format-excel" />
                    <Label htmlFor="format-excel" className="cursor-pointer flex items-center">
                      <FileSpreadsheet className={REPORTS_ICON_TOKENS.inlineSmall} />
                      Excel
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="csv" id="format-csv" />
                    <Label htmlFor="format-csv" className="cursor-pointer flex items-center">
                      <FileCSV className={REPORTS_ICON_TOKENS.inlineSmall} />
                      CSV
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pdf" id="format-pdf" />
                    <Label htmlFor="format-pdf" className="cursor-pointer flex items-center">
                      <File className={REPORTS_ICON_TOKENS.inlineSmall} />
                      PDF
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Button
                onClick={handleGenerateReport}
                disabled={isPending}
                className={REPORTS_LAYOUT_TOKENS.submitButton}
              >
                {isPending ? (
                  <span className={REPORTS_SPINNER_TOKENS.container}>
                    <svg
                      className={REPORTS_SPINNER_TOKENS.spinner}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {t('reports.generating')}
                  </span>
                ) : (
                  <span className={REPORTS_SPINNER_TOKENS.container}>
                    <Download className={REPORTS_ICON_TOKENS.inline} />
                    {t('reports.generate')}
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 보고서 설명 및 설정 요약 */}
        <Card>
          <CardHeader>
            <CardTitle>
              {reportType ? (
                <div className="flex items-center">
                  {getReportIcon(reportType as ReportType)}
                  {getReportTypeLabel(reportType as ReportType)} {t('reports.reportSuffix')}
                </div>
              ) : (
                t('reports.reportInfo')
              )}
            </CardTitle>
            <CardDescription>
              {reportType
                ? getReportDescription(reportType as ReportType)
                : t('reports.reportInfoPlaceholder')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-full">
              {reportType ? (
                <div className="space-y-6 w-full">
                  <div className={REPORTS_SUMMARY_TOKENS.container}>
                    <h3 className={REPORTS_SUMMARY_TOKENS.heading}>
                      {t('reports.settingsSummary')}
                    </h3>
                    <ul className={REPORTS_SUMMARY_TOKENS.list}>
                      <li className={REPORTS_SUMMARY_TOKENS.row}>
                        <span className={REPORTS_SUMMARY_TOKENS.label}>
                          {t('reports.reportTypeLabel')}
                        </span>
                        <span className={REPORTS_SUMMARY_TOKENS.value}>
                          {getReportTypeLabel(reportType as ReportType)}
                        </span>
                      </li>
                      <li className={REPORTS_SUMMARY_TOKENS.row}>
                        <span className={REPORTS_SUMMARY_TOKENS.label}>
                          {t('reports.outputFormatLabel')}
                        </span>
                        <span className={REPORTS_SUMMARY_TOKENS.valueWithIcon}>
                          {getFormatIcon(reportFormat)}
                          {reportFormat.toUpperCase()}
                        </span>
                      </li>
                      <li className={REPORTS_SUMMARY_TOKENS.row}>
                        <span className={REPORTS_SUMMARY_TOKENS.label}>
                          {t('reports.periodLabel')}
                        </span>
                        <span className={REPORTS_SUMMARY_TOKENS.value}>
                          {getPeriodLabel(dateRange)}
                        </span>
                      </li>
                      {site && (
                        <li className={REPORTS_SUMMARY_TOKENS.row}>
                          <span className={REPORTS_SUMMARY_TOKENS.label}>{t('reports.site')}</span>
                          <span className={REPORTS_SUMMARY_TOKENS.value}>
                            {siteLabels[site as Site]}
                          </span>
                        </li>
                      )}
                      {teamId && selectedTeamName && (
                        <li className={REPORTS_SUMMARY_TOKENS.row}>
                          <span className={REPORTS_SUMMARY_TOKENS.label}>{t('reports.team')}</span>
                          <span className={REPORTS_SUMMARY_TOKENS.value}>{selectedTeamName}</span>
                        </li>
                      )}
                      {reportType === 'calibration_status' && status && (
                        <li className={REPORTS_SUMMARY_TOKENS.row}>
                          <span className={REPORTS_SUMMARY_TOKENS.label}>
                            {t('reports.calibrationStatusFilterLabel')}
                          </span>
                          <span className={REPORTS_SUMMARY_TOKENS.value}>
                            {getCalibrationStatusLabel(status)}
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                  <div className={REPORTS_CONTENT_LIST_TOKENS.container}>
                    <h3 className={REPORTS_CONTENT_LIST_TOKENS.heading}>
                      {t('reports.includedContent')}
                    </h3>
                    <ul className={REPORTS_CONTENT_LIST_TOKENS.list}>
                      {getReportContents(reportType as ReportType).map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className={REPORTS_EMPTY_STATE_TOKENS.container}>
                  <FileText className={REPORTS_EMPTY_STATE_TOKENS.icon} />
                  <p className={REPORTS_EMPTY_STATE_TOKENS.text}>{t('reports.selectTypeHint')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
