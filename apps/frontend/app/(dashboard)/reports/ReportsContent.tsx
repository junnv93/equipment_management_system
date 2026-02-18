'use client';

import { useState } from 'react';
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
import { format } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { useLocale } from 'next-intl';
import { useGenerateReport, ReportGenerationResult } from '@/hooks/use-reports';
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

export default function ReportsContent() {
  const { toast } = useToast();
  const t = useTranslations('common');
  const currentLocale = useLocale();
  const dateLocale = currentLocale === 'ko' ? ko : enUS;

  const [reportType, setReportType] = useState<ReportType | ''>('');
  const [dateRange, setDateRange] = useState<ReportPeriod>('last_month');
  const [customDateRange, setCustomDateRange] = useState<DateRange>();
  const [reportFormat, setReportFormat] = useState<ReportFormat>('excel');
  const [equipmentId, setEquipmentId] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [lastGeneratedReport, setLastGeneratedReport] = useState<ReportGenerationResult | null>(
    null
  );

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

    let startDateStr: string | undefined;
    let endDateStr: string | undefined;

    if (dateRange === 'custom' && customDateRange?.from && customDateRange?.to) {
      startDateStr = format(customDateRange.from, 'yyyy-MM-dd');
      endDateStr = format(customDateRange.to, 'yyyy-MM-dd');
    }

    const additionalParams: Record<string, string> = {};

    if (reportType === 'equipment_inventory' || reportType === 'utilization_report') {
      if (equipmentId) additionalParams.equipmentId = equipmentId;
      if (categoryId) additionalParams.categoryId = categoryId;
    }

    if (reportType === 'team_equipment' && departmentId) {
      additionalParams.departmentId = departmentId;
    }

    if (reportType === 'calibration_status' && status) {
      additionalParams.status = status;
    }

    generateReportMutation({
      reportType: reportType as ReportType,
      format: reportFormat,
      dateRange,
      startDate: startDateStr,
      endDate: endDateStr,
      additionalParams,
    });
  };

  const getReportTypeLabel = (type: ReportType) => {
    return t(`reports.types.${type}` as Parameters<typeof t>[0]);
  };

  const getReportIcon = (type: ReportType) => {
    switch (type) {
      case 'equipment_inventory':
        return <FileText className="mr-2 h-4 w-4" />;
      case 'calibration_status':
        return <Clipboard className="mr-2 h-4 w-4" />;
      case 'utilization_report':
        return <BarChart className="mr-2 h-4 w-4" />;
      case 'team_equipment':
        return <FileText className="mr-2 h-4 w-4" />;
      case 'maintenance_report':
        return <Clipboard className="mr-2 h-4 w-4" />;
      default:
        return <FileText className="mr-2 h-4 w-4" />;
    }
  };

  const getReportDescription = (type: ReportType) => {
    return t(`reports.descriptions.${type}` as Parameters<typeof t>[0]);
  };

  const getFormatIcon = (fmt: ReportFormat) => {
    switch (fmt) {
      case 'excel':
        return <FileSpreadsheet className="mr-2 h-4 w-4" />;
      case 'csv':
        return <FileCSV className="mr-2 h-4 w-4" />;
      case 'pdf':
        return <File className="mr-2 h-4 w-4" />;
      default:
        return <FileText className="mr-2 h-4 w-4" />;
    }
  };

  const formatDate = (date: Date) => {
    return format(date, 'PPP', { locale: dateLocale });
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
          ? `${formatDate(customDateRange.from)} - ${formatDate(customDateRange.to)}`
          : t('reports.custom');
      default:
        return '';
    }
  };

  const getCategoryLabel = (id: string) => {
    switch (id) {
      case 'test':
        return t('reports.testEquipment');
      case 'computer':
        return t('reports.computer');
      case 'network':
        return t('reports.networkEquipment');
      default:
        return id;
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

  const getDepartmentLabel = (id: string) => {
    switch (id) {
      case '1':
        return t('reports.rdTeam');
      case '2':
        return t('reports.qcTeam');
      case '3':
        return t('reports.prodTeam');
      case '4':
        return t('reports.testTeam');
      default:
        return id;
    }
  };

  const getReportContents = (type: ReportType): string[] => {
    const key = `reports.contents.${type}` as Parameters<typeof t>[0];
    const contents = t.raw(key);
    return Array.isArray(contents) ? (contents as string[]) : [];
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('reports.title')}</h1>
          <p className="text-muted-foreground">{t('reports.subtitle')}</p>
        </div>
      </div>

      {lastGeneratedReport && (
        <div className="mb-6 p-4 border rounded-md bg-green-50 border-green-200 text-green-800 flex items-start space-x-2">
          <CheckCircle2 className="h-5 w-5 mt-0.5" />
          <div>
            <h4 className="font-medium">{t('reports.generateComplete')}</h4>
            <p>{t('reports.fileDownloaded', { fileName: lastGeneratedReport.fileName })}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.generate')}</CardTitle>
            <CardDescription>{t('reports.generateOptions')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="report-type">{t('reports.reportType')}</Label>
                <Select
                  value={reportType}
                  onValueChange={(value) => setReportType(value as ReportType)}
                >
                  <SelectTrigger id="report-type">
                    <SelectValue placeholder={t('reports.reportTypePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equipment_inventory">
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        {t('reports.types.equipment_inventory')}
                      </div>
                    </SelectItem>
                    <SelectItem value="calibration_status">
                      <div className="flex items-center">
                        <Clipboard className="mr-2 h-4 w-4" />
                        {t('reports.types.calibration_status')}
                      </div>
                    </SelectItem>
                    <SelectItem value="utilization_report">
                      <div className="flex items-center">
                        <BarChart className="mr-2 h-4 w-4" />
                        {t('reports.types.utilization_report')}
                      </div>
                    </SelectItem>
                    <SelectItem value="team_equipment">
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        {t('reports.types.team_equipment')}
                      </div>
                    </SelectItem>
                    <SelectItem value="maintenance_report">
                      <div className="flex items-center">
                        <Clipboard className="mr-2 h-4 w-4" />
                        {t('reports.types.maintenance_report')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* 보고서 유형별 추가 옵션 */}
              {reportType === 'equipment_inventory' && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="equipment-category">{t('reports.equipmentCategory')}</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger id="equipment-category">
                        <SelectValue placeholder={t('reports.allCategories')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">{t('reports.allCategories')}</SelectItem>
                        <SelectItem value="test">{t('reports.testEquipment')}</SelectItem>
                        <SelectItem value="computer">{t('reports.computer')}</SelectItem>
                        <SelectItem value="network">{t('reports.networkEquipment')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {reportType === 'calibration_status' && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="calibration-status">
                      {t('reports.calibrationStatusLabel')}
                    </Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger id="calibration-status">
                        <SelectValue placeholder={t('reports.allStatuses')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">{t('reports.allStatuses')}</SelectItem>
                        <SelectItem value="completed">{t('reports.completed')}</SelectItem>
                        <SelectItem value="scheduled">{t('reports.scheduled')}</SelectItem>
                        <SelectItem value="overdue">{t('reports.overdue')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {reportType === 'utilization_report' && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="equipment-id">{t('reports.equipmentSelect')}</Label>
                    <Select value={equipmentId} onValueChange={setEquipmentId}>
                      <SelectTrigger id="equipment-id">
                        <SelectValue placeholder={t('reports.allEquipment')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">{t('reports.allEquipment')}</SelectItem>
                        <SelectItem value="1">{t('reports.sampleEquipment1')}</SelectItem>
                        <SelectItem value="2">{t('reports.sampleEquipment2')}</SelectItem>
                        <SelectItem value="3">{t('reports.sampleEquipment3')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {reportType === 'team_equipment' && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="department-id">{t('reports.departmentSelect')}</Label>
                    <Select value={departmentId} onValueChange={setDepartmentId}>
                      <SelectTrigger id="department-id">
                        <SelectValue placeholder={t('reports.departmentSelect')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">{t('reports.rdTeam')}</SelectItem>
                        <SelectItem value="2">{t('reports.qcTeam')}</SelectItem>
                        <SelectItem value="3">{t('reports.prodTeam')}</SelectItem>
                        <SelectItem value="4">{t('reports.testTeam')}</SelectItem>
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
                  onValueChange={(value) => setDateRange(value as ReportPeriod)}
                >
                  <SelectTrigger>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
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
                  onValueChange={(value) => setReportFormat(value as ReportFormat)}
                  className="flex items-center space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="excel" id="format-excel" />
                    <Label htmlFor="format-excel" className="cursor-pointer flex items-center">
                      <FileSpreadsheet className="mr-1 h-4 w-4" />
                      Excel
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="csv" id="format-csv" />
                    <Label htmlFor="format-csv" className="cursor-pointer flex items-center">
                      <FileCSV className="mr-1 h-4 w-4" />
                      CSV
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pdf" id="format-pdf" />
                    <Label htmlFor="format-pdf" className="cursor-pointer flex items-center">
                      <File className="mr-1 h-4 w-4" />
                      PDF
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Button onClick={handleGenerateReport} disabled={isPending} className="w-full mt-2">
                {isPending ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
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
                  <span className="flex items-center">
                    <Download className="mr-2 h-4 w-4" />
                    {t('reports.generate')}
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 보고서 미리보기 또는 설명 */}
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
                  <div className="border rounded-lg p-4 bg-slate-50">
                    <h3 className="font-medium mb-2">{t('reports.settingsSummary')}</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t('reports.reportTypeLabel')}
                        </span>
                        <span className="font-medium">
                          {getReportTypeLabel(reportType as ReportType)}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t('reports.outputFormatLabel')}
                        </span>
                        <span className="font-medium flex items-center">
                          {getFormatIcon(reportFormat)}
                          {reportFormat.toUpperCase()}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">{t('reports.periodLabel')}</span>
                        <span className="font-medium">{getPeriodLabel(dateRange)}</span>
                      </li>
                      {reportType === 'equipment_inventory' && categoryId && (
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">
                            {t('reports.equipmentCategoryLabel')}
                          </span>
                          <span className="font-medium">{getCategoryLabel(categoryId)}</span>
                        </li>
                      )}
                      {reportType === 'calibration_status' && status && (
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">
                            {t('reports.calibrationStatusFilterLabel')}
                          </span>
                          <span className="font-medium">{getCalibrationStatusLabel(status)}</span>
                        </li>
                      )}
                      {reportType === 'team_equipment' && departmentId && (
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">
                            {t('reports.departmentLabel')}
                          </span>
                          <span className="font-medium">{getDepartmentLabel(departmentId)}</span>
                        </li>
                      )}
                    </ul>
                  </div>
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">{t('reports.includedContent')}</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {getReportContents(reportType as ReportType).map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center p-4">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{t('reports.selectTypeHint')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
