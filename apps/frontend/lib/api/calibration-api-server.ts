/**
 * 교정 관리 Server-Side API 클라이언트
 *
 * ⚠️ IMPORTANT: Server Component 전용
 *
 * 사용처:
 * - app/(dashboard)/calibration/page.tsx (Server Component)
 * - 기타 Server Component에서 교정 데이터 fetch가 필요한 경우
 *
 * 절대로 'use client' 컴포넌트에서 import하지 마세요!
 * 클라이언트에서는 calibration-api.ts를 사용하세요.
 *
 * @see lib/api/calibration-api.ts (Client-side API)
 */

import { createServerApiClient } from './server-api-client';
import { transformSingleResponse } from './utils/response-transformers';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import type { CalibrationQuery, CalibrationSummary } from './calibration-api';

/**
 * 교정 요약 정보 조회 (Server Component용)
 *
 * @param query - 교정 조회 쿼리 파라미터
 * @returns 교정 요약 정보 (통계 + 대시보드 데이터)
 */
export async function getCalibrationSummary(
  query: CalibrationQuery = {}
): Promise<CalibrationSummary | undefined> {
  try {
    const apiClient = await createServerApiClient();
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const url = `${API_ENDPOINTS.CALIBRATIONS.SUMMARY}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await apiClient.get(url);
    return transformSingleResponse<CalibrationSummary>(response);
  } catch (error) {
    console.error('[CalibrationApiServer] Failed to fetch calibration summary:', error);
    return undefined; // Graceful degradation
  }
}
