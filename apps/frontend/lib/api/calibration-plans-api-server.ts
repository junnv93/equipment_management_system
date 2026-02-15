/**
 * 교정계획서 Server-Side API 클라이언트
 *
 * ⚠️ IMPORTANT: Server Component 전용
 *
 * 사용처:
 * - app/(dashboard)/calibration-plans/page.tsx (Server Component)
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
import type { CalibrationPlan } from './calibration-plans-api';

export interface CalibrationPlansQuery {
  year?: string;
  siteId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 교정계획서 목록 조회 (Server Component용)
 *
 * @param query - 교정계획 조회 쿼리 파라미터
 * @returns 페이지네이션된 교정계획 목록
 */
export async function getCalibrationPlansList(
  query: CalibrationPlansQuery = {}
): Promise<PaginatedResponse<CalibrationPlan>> {
  const apiClient = await createServerApiClient();
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  const url = `/api/calibration-plans${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await apiClient.get(url);
  return transformPaginatedResponse<CalibrationPlan>(response);
}
