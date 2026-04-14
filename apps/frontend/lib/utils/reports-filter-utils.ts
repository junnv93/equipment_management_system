/**
 * ============================================================================
 * 🔴 SSOT: 보고서 필터 변환 유틸리티 (Single Source of Truth)
 * ============================================================================
 *
 * ⚠️ 이 파일은 보고서 필터 파싱/변환의 유일한 소스입니다.
 * 다른 파일에서 직접 필터 파싱 로직을 작성하지 마세요!
 *
 * 사용처:
 * - app/(dashboard)/reports/page.tsx (Server Component)
 * - hooks/use-reports-filters.ts (Client Hook)
 * - app/(dashboard)/reports/ReportsContent.tsx (Client Component)
 *
 * 패턴 출처: lib/utils/calibration-filter-utils.ts (SSOT 표준)
 * ============================================================================
 */

import type { Site } from '@equipment-management/schemas';
import type { ReportType, ReportFormat, ReportPeriod } from '@/lib/api/reports-api';

/**
 * 교정 보고서 status 서브필터 (calibration_status 보고서 전용)
 */
export const REPORT_CALIBRATION_STATUS_VALUES = ['completed', 'scheduled', 'overdue'] as const;
export type ReportCalibrationStatus = (typeof REPORT_CALIBRATION_STATUS_VALUES)[number];

/**
 * ALL 센티널 (SSOT)
 *
 * Radix/shadcn `<Select>`은 empty string value를 허용하지 않으므로 "전체"
 * 옵션에 사용할 placeholder 값이 필요. URL 표현과 UI 표현을 단일 상수로
 * 통일하여 calibration-filter-utils와 동일한 컨벤션을 따른다.
 *
 * - URL: `?site=_all` → parseReportsFiltersFromSearchParams가 `''`로 변환
 * - UI:  `<SelectItem value={ALL_SENTINEL}>` + toSelectValue/fromSelectValue
 */
export const ALL_SENTINEL = '_all';

/**
 * UI에서 사용하는 필터 타입 (URL 파라미터와 1:1 대응)
 *
 * - reportType: '' = 미선택
 * - customDateFrom/To: ISO yyyy-MM-dd 문자열 (DateRange는 컴포넌트에서 Date로 변환)
 */
export interface UIReportsFilters {
  reportType: ReportType | '';
  dateRange: ReportPeriod;
  customDateFrom: string;
  customDateTo: string;
  reportFormat: ReportFormat;
  site: Site | '';
  teamId: string;
  status: ReportCalibrationStatus | '';
}

/**
 * UI 필터 기본값
 */
export const DEFAULT_REPORTS_FILTERS: UIReportsFilters = {
  reportType: '',
  dateRange: 'last_month',
  customDateFrom: '',
  customDateTo: '',
  reportFormat: 'excel',
  site: '',
  teamId: '',
  status: '',
};

const REPORT_TYPE_VALUES: ReportType[] = [
  'equipment_inventory',
  'calibration_status',
  'utilization_report',
  'team_equipment',
  'maintenance_report',
];

const REPORT_FORMAT_VALUES: ReportFormat[] = ['pdf', 'excel', 'csv'];

const REPORT_PERIOD_VALUES: ReportPeriod[] = [
  'last_week',
  'last_month',
  'last_quarter',
  'last_year',
  'custom',
];

/**
 * URLSearchParams에서 UI 필터 객체로 변환
 *
 * 서버 컴포넌트(Record)와 클라이언트 훅(URLSearchParams) 모두 지원
 */
export function parseReportsFiltersFromSearchParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): UIReportsFilters {
  const get = (key: string): string | null => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key);
    }
    const value = searchParams[key];
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
      return value[0];
    }
    return null;
  };

  // ✅ ALL_SENTINEL을 빈 문자열로 변환 (SSOT)
  const stripAll = (raw: string | null): string => (raw && raw !== ALL_SENTINEL ? raw : '');

  const reportTypeRaw = stripAll(get('reportType'));
  const reportType = (REPORT_TYPE_VALUES as string[]).includes(reportTypeRaw)
    ? (reportTypeRaw as ReportType)
    : DEFAULT_REPORTS_FILTERS.reportType;

  const dateRangeRaw = get('dateRange') || '';
  const dateRange = (REPORT_PERIOD_VALUES as string[]).includes(dateRangeRaw)
    ? (dateRangeRaw as ReportPeriod)
    : DEFAULT_REPORTS_FILTERS.dateRange;

  const customDateFrom = get('customDateFrom') || DEFAULT_REPORTS_FILTERS.customDateFrom;
  const customDateTo = get('customDateTo') || DEFAULT_REPORTS_FILTERS.customDateTo;

  const reportFormatRaw = get('reportFormat') || '';
  const reportFormat = (REPORT_FORMAT_VALUES as string[]).includes(reportFormatRaw)
    ? (reportFormatRaw as ReportFormat)
    : DEFAULT_REPORTS_FILTERS.reportFormat;

  const site = stripAll(get('site')) as Site | '';
  const teamId = stripAll(get('teamId'));

  const statusRaw = stripAll(get('status'));
  const status = (REPORT_CALIBRATION_STATUS_VALUES as readonly string[]).includes(statusRaw)
    ? (statusRaw as ReportCalibrationStatus)
    : DEFAULT_REPORTS_FILTERS.status;

  return {
    reportType,
    dateRange,
    customDateFrom,
    customDateTo,
    reportFormat,
    site,
    teamId,
    status,
  };
}

/**
 * API 쿼리 파라미터 타입 (convertFiltersToApiParams 반환값)
 *
 * generateReport의 additionalParams 및 직접 파라미터로 전달할 수 있는 형태.
 * reportType·format·dateRange는 별도 인수로 전달하므로 여기서 제외.
 */
export interface ApiReportsFilters {
  site?: string;
  teamId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * UI 필터 → API 쿼리 파라미터 변환
 *
 * dateRange가 'custom'인 경우 customDateFrom/To를 startDate/endDate로 변환.
 * 빈 문자열 필드는 undefined로 정규화하여 API 파라미터에서 제외.
 */
export function convertFiltersToApiParams(filters: UIReportsFilters): ApiReportsFilters {
  const result: ApiReportsFilters = {};
  if (filters.site) result.site = filters.site;
  if (filters.teamId) result.teamId = filters.teamId;
  if (filters.status) result.status = filters.status;
  if (filters.dateRange === 'custom') {
    if (filters.customDateFrom) result.startDate = filters.customDateFrom;
    if (filters.customDateTo) result.endDate = filters.customDateTo;
  }
  return result;
}

/**
 * 활성 필터 개수 (reportType / dateRange / format 등 보고서 정의 자체는 제외하고
 * 서브필터만 카운트)
 */
export function countActiveReportsFilters(filters: UIReportsFilters): number {
  let count = 0;
  if (filters.site) count++;
  if (filters.teamId) count++;
  if (filters.status) count++;
  if (filters.dateRange === 'custom' && filters.customDateFrom && filters.customDateTo) count++;
  return count;
}
