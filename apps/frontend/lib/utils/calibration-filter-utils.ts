/**
 * ============================================================================
 * 🔴 SSOT: 교정 필터 변환 유틸리티 (Single Source of Truth)
 * ============================================================================
 *
 * ⚠️ 이 파일은 교정 필터 파싱/변환의 유일한 소스입니다.
 * 다른 파일에서 직접 필터 파싱 로직을 작성하지 마세요!
 *
 * 이 파일이 존재하는 이유:
 * - 2026-02-14: Equipment와 Teams 페이지의 SSOT 패턴을 Calibration 페이지에 적용
 * - page.tsx의 하드코딩된 필터 파싱 로직을 중앙화
 *
 * 사용처:
 * - app/(dashboard)/calibration/page.tsx (Server Component)
 * - hooks/use-calibration-filters.ts (Client Hook)
 * - app/(dashboard)/calibration/CalibrationContent.tsx (Client Component)
 *
 * ============================================================================
 */

import type { Site } from '@equipment-management/schemas';

/**
 * 교정 기한 상태 (날짜 기반 가상 상태)
 *
 * equipment.status 컬럼이 아닌 equipment.nextCalibrationDate 기반:
 * - overdue: nextCalibrationDate < today (교정 기한 초과)
 * - upcoming: today ≤ nextCalibrationDate ≤ today+30일 (교정 예정)
 * - normal: nextCalibrationDate > today+30일 또는 null (정상)
 *
 * 이유: CalibrationOverdueScheduler가 calibration_overdue → non_conforming으로
 * 자동 전환하므로 equipment.status로는 교정 기한 초과 장비를 식별할 수 없음.
 */
export const CALIBRATION_DUE_STATUS_VALUES = ['overdue', 'upcoming', 'normal'] as const;
export type CalibrationDueStatus = (typeof CALIBRATION_DUE_STATUS_VALUES)[number];

export const CALIBRATION_DUE_STATUS_LABELS: Record<CalibrationDueStatus, string> = {
  overdue: '교정 기한 초과',
  upcoming: '교정 예정',
  normal: '정상',
};

/**
 * UI에서 사용하는 필터 타입 (URL 파라미터와 1:1 대응)
 */
export interface UICalibrationFilters {
  search: string; // 검색어 (장비명, 관리번호)
  site: Site | ''; // 사이트 ('' = 전체)
  teamId: string; // 팀 ID ('' = 전체)
  approvalStatus: string; // 승인 상태 ('' = 전체)
  result: string; // 교정 결과 ('' = 전체)
  calibrationDueStatus: CalibrationDueStatus | ''; // 교정 기한 상태 ('' = 전체)
  startDate: string; // 시작일 ('' = 전체)
  endDate: string; // 종료일 ('' = 전체)
  tab: 'list' | 'intermediate' | 'self-inspection'; // 활성 탭 (URL 기반 상태)
}

/**
 * API에서 사용하는 필터 타입 (백엔드 쿼리 파라미터)
 */
export interface ApiCalibrationFilters {
  search?: string;
  site?: Site;
  teamId?: string;
  approvalStatus?: string;
  result?: string;
  calibrationDueStatus?: CalibrationDueStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

/**
 * UI 필터 기본값
 */
export const DEFAULT_UI_FILTERS: UICalibrationFilters = {
  search: '',
  site: '',
  teamId: '',
  approvalStatus: '',
  result: '',
  calibrationDueStatus: '',
  startDate: '',
  endDate: '',
  tab: 'list',
};

/**
 * URLSearchParams에서 UI 필터 객체로 변환
 *
 * 서버 컴포넌트와 클라이언트 훅에서 동일하게 사용
 *
 * @param searchParams - URL 쿼리 파라미터 (URLSearchParams 또는 Record<string, string | string[] | undefined>)
 * @returns UI 필터 객체
 */
export function parseCalibrationFiltersFromSearchParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): UICalibrationFilters {
  // URLSearchParams와 일반 객체 모두 지원
  const get = (key: string): string | null => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key);
    }
    const value = searchParams[key];
    if (typeof value === 'string') return value;
    // 배열인 경우 첫 번째 값 반환 (Next.js가 중복 쿼리 파라미터를 배열로 전달할 수 있음)
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
      return value[0];
    }
    return null;
  };

  const search = get('search') || DEFAULT_UI_FILTERS.search;

  // ✅ "_all"을 빈 문자열로 변환 (무한 리다이렉트 방지)
  const siteRaw = get('site') || DEFAULT_UI_FILTERS.site;
  const site = (siteRaw === '_all' ? '' : siteRaw) as Site | '';

  const teamIdRaw = get('teamId') || DEFAULT_UI_FILTERS.teamId;
  const teamId = teamIdRaw === '_all' ? '' : teamIdRaw;

  const approvalStatusRaw = get('approvalStatus') || DEFAULT_UI_FILTERS.approvalStatus;
  const approvalStatus = approvalStatusRaw === '_all' ? '' : approvalStatusRaw;

  const resultRaw = get('result') || DEFAULT_UI_FILTERS.result;
  const result = resultRaw === '_all' ? '' : resultRaw;

  const calibrationDueStatusRaw =
    get('calibrationDueStatus') || DEFAULT_UI_FILTERS.calibrationDueStatus;
  const calibrationDueStatus = (
    calibrationDueStatusRaw === '_all' ? '' : calibrationDueStatusRaw
  ) as CalibrationDueStatus | '';

  const startDate = get('startDate') || DEFAULT_UI_FILTERS.startDate;
  const endDate = get('endDate') || DEFAULT_UI_FILTERS.endDate;

  const tabRaw = get('tab') || '';
  const tab = (['list', 'intermediate', 'self-inspection'] as const).includes(
    tabRaw as 'list' | 'intermediate' | 'self-inspection'
  )
    ? (tabRaw as UICalibrationFilters['tab'])
    : DEFAULT_UI_FILTERS.tab;

  return {
    search,
    site,
    teamId,
    approvalStatus,
    result,
    calibrationDueStatus,
    startDate,
    endDate,
    tab,
  };
}

/**
 * UI 필터를 API 쿼리 파라미터로 변환
 *
 * @param filters - UI 필터 객체
 * @returns API 쿼리 파라미터 객체
 */
export function convertFiltersToApiParams(filters: UICalibrationFilters): ApiCalibrationFilters {
  return {
    search: filters.search || undefined,
    site: filters.site || undefined,
    teamId: filters.teamId || undefined,
    approvalStatus: filters.approvalStatus || undefined,
    result: filters.result || undefined,
    calibrationDueStatus: filters.calibrationDueStatus || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    pageSize: 50, // 교정 기록은 많지 않으므로 한 번에 로드
  };
}

/**
 * 활성 필터 개수 계산
 *
 * @param filters - UI 필터 객체
 * @returns 활성 필터 개수
 */
export function countActiveFilters(filters: UICalibrationFilters): number {
  let count = 0;
  if (filters.search) count++;
  if (filters.site) count++;
  if (filters.teamId) count++;
  if (filters.approvalStatus) count++;
  if (filters.result) count++;
  if (filters.calibrationDueStatus) count++;
  if (filters.startDate) count++;
  if (filters.endDate) count++;
  return count;
}
