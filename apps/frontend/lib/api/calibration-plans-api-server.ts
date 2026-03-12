/**
 * 교정계획서 Server-Side API 클라이언트
 *
 * ⚠️ IMPORTANT: Server Component 전용
 *
 * 사용처:
 * - app/(dashboard)/calibration-plans/page.tsx (Server Component - 목록)
 * - app/(dashboard)/calibration-plans/[uuid]/page.tsx (Server Component - 상세)
 * - 기타 Server Component에서 교정계획 데이터 fetch가 필요한 경우
 *
 * 절대로 'use client' 컴포넌트에서 import하지 마세요!
 * 클라이언트에서는 calibration-plans-api.ts를 사용하세요.
 *
 * @see lib/api/calibration-plans-api.ts (Client-side API)
 */

import { createServerApiClient } from './server-api-client';
import { transformPaginatedResponse } from './utils/response-transformers';
import type { PaginatedResponse } from './types';
import type { CalibrationPlan, CalibrationPlanSummary } from './calibration-plans-api';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';

export interface CalibrationPlansQuery {
  year?: string;
  siteId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  includeSummary?: boolean;
}

/**
 * 교정계획서 목록 조회 (Server Component용)
 *
 * @param query - 교정계획 조회 쿼리 파라미터
 * @returns 페이지네이션된 교정계획 목록
 */
export async function getCalibrationPlansList(
  query: CalibrationPlansQuery = {}
): Promise<PaginatedResponse<CalibrationPlan, CalibrationPlanSummary>> {
  const apiClient = await createServerApiClient();
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  const url = `${API_ENDPOINTS.CALIBRATION_PLANS.LIST}${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await apiClient.get(url);
  return transformPaginatedResponse<CalibrationPlan, CalibrationPlanSummary>(response);
}

/**
 * 교정계획서 상세 조회 (Server Component용)
 *
 * React.cache()는 page.tsx에서 적용합니다 (generateMetadata와 Page 간 dedup).
 * 이 함수 자체는 순수 fetch로 유지하여 캐시 전략을 호출부에서 결정합니다.
 *
 * @param uuid - 교정계획서 UUID
 * @returns 교정계획서 상세 (항목 포함)
 */
export async function getCalibrationPlan(uuid: string): Promise<CalibrationPlan> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.get(API_ENDPOINTS.CALIBRATION_PLANS.GET(uuid));
  return response.data;
}
