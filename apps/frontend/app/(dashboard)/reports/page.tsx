'use client';

import { useState } from 'react';
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
import { DateRange } from 'react-day-picker';
import { useGenerateReport, ReportGenerationResult } from '@/hooks/use-reports';
import { ReportType, ReportFormat, ReportPeriod } from '@/lib/api/reports-api';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
// Tabs components removed - not currently used in this version
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

export default function ReportsPage() {
  const { toast } = useToast();

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
        title: '보고서 생성 완료',
        description: '보고서가 성공적으로 생성되었습니다.',
      });
      setLastGeneratedReport(data);
    },
    onError: (error: unknown) => {
      toast({
        title: '보고서 생성 실패',
        description: getErrorMessage(error, '보고서 생성 중 오류가 발생했습니다.'),
        variant: 'destructive',
      });
    },
  });

  const handleGenerateReport = () => {
    if (!reportType) {
      toast({
        title: '보고서 유형 선택 필요',
        description: '보고서 유형을 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (dateRange === 'custom' && (!customDateRange?.from || !customDateRange?.to)) {
      toast({
        title: '날짜 범위 선택 필요',
        description: '사용자 정의 날짜 범위를 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    // 날짜를 문자열로 변환
    let startDateStr: string | undefined;
    let endDateStr: string | undefined;

    if (dateRange === 'custom' && customDateRange?.from && customDateRange?.to) {
      startDateStr = format(customDateRange.from, 'yyyy-MM-dd');
      endDateStr = format(customDateRange.to, 'yyyy-MM-dd');
    }

    // 리포트 유형에 따른 추가 파라미터 설정
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

  // 보고서 유형에 따른 라벨 반환
  const getReportTypeLabel = (type: ReportType) => {
    switch (type) {
      case 'equipment_inventory':
        return '장비 인벤토리';
      case 'calibration_status':
        return '교정 상태';
      case 'utilization_report':
        return '활용률';
      case 'team_equipment':
        return '팀별 장비';
      case 'maintenance_report':
        return '점검 보고서';
      default:
        return '';
    }
  };

  // 리포트 유형에 대한 아이콘 반환
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

  // 리포트 유형에 대한 설명 반환
  const getReportDescription = (type: ReportType) => {
    switch (type) {
      case 'equipment_inventory':
        return '모든 장비의 현재 상태와 세부 정보가 포함된 인벤토리 보고서입니다.';
      case 'calibration_status':
        return '모든 장비의 교정 일정과 상태가 포함된 교정 상태 보고서입니다.';
      case 'utilization_report':
        return '장비별 사용 통계와 가용성 분석이 포함된 활용률 보고서입니다.';
      case 'team_equipment':
        return '각 팀이 보유한 장비 목록과 현황이 포함된 팀별 장비 보고서입니다.';
      case 'maintenance_report':
        return '장비 유지보수 일정 및 이력이 포함된 점검 보고서입니다.';
      default:
        return '';
    }
  };

  // 포맷에 대한 아이콘 반환
  const getFormatIcon = (format: ReportFormat) => {
    switch (format) {
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

  // 날짜 형식 설정
  const formatDate = (date: Date) => {
    return format(date, 'yyyy년 MM월 dd일');
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">보고서 관리</h1>
          <p className="text-muted-foreground">
            다양한 유형의 보고서를 생성하고 내보낼 수 있습니다.
          </p>
        </div>
      </div>

      {lastGeneratedReport && (
        <div className="mb-6 p-4 border rounded-md bg-green-50 border-green-200 text-green-800 flex items-start space-x-2">
          <CheckCircle2 className="h-5 w-5 mt-0.5" />
          <div>
            <h4 className="font-medium">보고서 생성 완료</h4>
            <p>{lastGeneratedReport.fileName} 파일이 다운로드되었습니다.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>보고서 생성</CardTitle>
            <CardDescription>원하는 보고서 유형과 옵션을 선택하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="report-type">보고서 유형</Label>
                <Select
                  value={reportType}
                  onValueChange={(value) => setReportType(value as ReportType)}
                >
                  <SelectTrigger id="report-type">
                    <SelectValue placeholder="보고서 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equipment_inventory">
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        장비 인벤토리
                      </div>
                    </SelectItem>
                    <SelectItem value="calibration_status">
                      <div className="flex items-center">
                        <Clipboard className="mr-2 h-4 w-4" />
                        교정 상태
                      </div>
                    </SelectItem>
                    <SelectItem value="utilization_report">
                      <div className="flex items-center">
                        <BarChart className="mr-2 h-4 w-4" />
                        활용률
                      </div>
                    </SelectItem>
                    <SelectItem value="team_equipment">
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        팀별 장비
                      </div>
                    </SelectItem>
                    <SelectItem value="maintenance_report">
                      <div className="flex items-center">
                        <Clipboard className="mr-2 h-4 w-4" />
                        점검 보고서
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
                    <Label htmlFor="equipment-category">장비 분류</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger id="equipment-category">
                        <SelectValue placeholder="모든 분류" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">모든 분류</SelectItem>
                        <SelectItem value="test">테스트 장비</SelectItem>
                        <SelectItem value="computer">컴퓨터</SelectItem>
                        <SelectItem value="network">네트워크 장비</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {reportType === 'calibration_status' && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="calibration-status">교정 상태</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger id="calibration-status">
                        <SelectValue placeholder="모든 상태" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">모든 상태</SelectItem>
                        <SelectItem value="completed">완료</SelectItem>
                        <SelectItem value="scheduled">예정됨</SelectItem>
                        <SelectItem value="overdue">만료됨</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {reportType === 'utilization_report' && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="equipment-id">장비 선택</Label>
                    <Select value={equipmentId} onValueChange={setEquipmentId}>
                      <SelectTrigger id="equipment-id">
                        <SelectValue placeholder="모든 장비" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">모든 장비</SelectItem>
                        <SelectItem value="1">오실로스코프 #1</SelectItem>
                        <SelectItem value="2">스펙트럼 분석기 #2</SelectItem>
                        <SelectItem value="3">신호 발생기 #3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {reportType === 'team_equipment' && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="department-id">부서 선택</Label>
                    <Select value={departmentId} onValueChange={setDepartmentId}>
                      <SelectTrigger id="department-id">
                        <SelectValue placeholder="부서 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">연구개발팀</SelectItem>
                        <SelectItem value="2">품질관리팀</SelectItem>
                        <SelectItem value="3">생산팀</SelectItem>
                        <SelectItem value="4">시험팀</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid gap-3">
                <Label>기간 선택</Label>
                <Select
                  value={dateRange}
                  onValueChange={(value) => setDateRange(value as ReportPeriod)}
                >
                  <SelectTrigger>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="기간 선택" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last_week">최근 1주일</SelectItem>
                    <SelectItem value="last_month">최근 1개월</SelectItem>
                    <SelectItem value="last_quarter">최근 3개월</SelectItem>
                    <SelectItem value="last_year">최근 1년</SelectItem>
                    <SelectItem value="custom">사용자 정의</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateRange === 'custom' && (
                <div className="grid gap-3">
                  <Label>사용자 정의 날짜 범위</Label>
                  <DatePickerWithRange date={customDateRange} setDate={setCustomDateRange} />
                </div>
              )}

              <Separator />

              <div className="grid gap-3">
                <Label>출력 형식</Label>
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
                    보고서 생성 중...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Download className="mr-2 h-4 w-4" />
                    보고서 생성
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
                  {getReportTypeLabel(reportType as ReportType)} 보고서
                </div>
              ) : (
                '보고서 정보'
              )}
            </CardTitle>
            <CardDescription>
              {reportType
                ? getReportDescription(reportType as ReportType)
                : '보고서 유형을 선택하면 자세한 정보가 표시됩니다.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-full">
              {reportType ? (
                <div className="space-y-6 w-full">
                  <div className="border rounded-lg p-4 bg-slate-50">
                    <h3 className="font-medium mb-2">보고서 설정 요약</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">보고서 유형:</span>
                        <span className="font-medium">
                          {getReportTypeLabel(reportType as ReportType)}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">출력 형식:</span>
                        <span className="font-medium flex items-center">
                          {getFormatIcon(reportFormat)}
                          {reportFormat.toUpperCase()}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">기간:</span>
                        <span className="font-medium">
                          {dateRange === 'custom'
                            ? customDateRange?.from && customDateRange?.to
                              ? `${formatDate(customDateRange.from)} - ${formatDate(customDateRange.to)}`
                              : '사용자 정의'
                            : dateRange === 'last_week'
                              ? '최근 1주일'
                              : dateRange === 'last_month'
                                ? '최근 1개월'
                                : dateRange === 'last_quarter'
                                  ? '최근 3개월'
                                  : '최근 1년'}
                        </span>
                      </li>
                      {reportType === 'equipment_inventory' && categoryId && (
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">장비 분류:</span>
                          <span className="font-medium">
                            {categoryId === 'test'
                              ? '테스트 장비'
                              : categoryId === 'computer'
                                ? '컴퓨터'
                                : categoryId === 'network'
                                  ? '네트워크 장비'
                                  : categoryId}
                          </span>
                        </li>
                      )}
                      {reportType === 'calibration_status' && status && (
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">교정 상태:</span>
                          <span className="font-medium">
                            {status === 'completed'
                              ? '완료'
                              : status === 'scheduled'
                                ? '예정됨'
                                : status === 'overdue'
                                  ? '만료됨'
                                  : status}
                          </span>
                        </li>
                      )}
                      {reportType === 'team_equipment' && departmentId && (
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">부서:</span>
                          <span className="font-medium">
                            {departmentId === '1'
                              ? '연구개발팀'
                              : departmentId === '2'
                                ? '품질관리팀'
                                : departmentId === '3'
                                  ? '생산팀'
                                  : departmentId === '4'
                                    ? '시험팀'
                                    : departmentId}
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">보고서 포함 내용</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {reportType === 'equipment_inventory' && (
                        <>
                          <li>장비 기본 정보 (ID, 이름, 모델명)</li>
                          <li>제조사 및 시리얼 번호</li>
                          <li>현재 상태 및 위치 정보</li>
                          <li>구매일 및 관리 담당자</li>
                        </>
                      )}
                      {reportType === 'calibration_status' && (
                        <>
                          <li>교정 상태 (완료, 예정, 만료)</li>
                          <li>교정 주기 및 최근 교정일</li>
                          <li>다음 교정 예정일</li>
                          <li>교정 담당자 정보</li>
                        </>
                      )}
                      {reportType === 'utilization_report' && (
                        <>
                          <li>장비별 사용률 통계</li>
                          <li>사용 시간 및 빈도</li>
                          <li>유휴 시간 분석</li>
                          <li>사용 패턴 및 추세 분석</li>
                        </>
                      )}
                      {reportType === 'team_equipment' && (
                        <>
                          <li>부서별 보유 장비 목록</li>
                          <li>장비 상태 및 가용성 정보</li>
                          <li>장비별 담당자 정보</li>
                          <li>장비 교체 계획 정보</li>
                        </>
                      )}
                      {reportType === 'maintenance_report' && (
                        <>
                          <li>정기 점검 일정 및 이력</li>
                          <li>유지보수 담당자 정보</li>
                          <li>점검 결과 및 조치 사항</li>
                          <li>예상 부품 교체 주기</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center p-4">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    왼쪽에서 보고서 유형을 선택하면 여기에 상세 정보가 표시됩니다.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
