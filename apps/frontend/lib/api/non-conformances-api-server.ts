/**
 * 부적합(Non-Conformances) Server-Side API 클라이언트
 *
 * ⚠️ IMPORTANT: Server Component 전용
 *
 * 사용처:
 * - app/(dashboard)/equipment/[id]/non-conformance/page.tsx (Server Component)
 * - 기타 Server Component에서 부적합 데이터 fetch가 필요한 경우
 *
 * 절대로 'use client' 컴포넌트에서 import하지 마세요!
 * 클라이언트에서는 non-conformances-api.ts를 사용하세요.
 *
 * @see lib/api/non-conformances-api.ts (Client-side API)
 */

import { createServerApiClient } from './server-api-client';
import { transformPaginatedResponse } from './utils/response-transformers';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import type { PaginatedResponse } from './types';
import type { NonConformance, NonConformanceQuery } from './non-conformances-api';

// Re-export types for convenience
export type { NonConformance, NonConformanceQuery };

/**
 * 부적합 목록 조회 (Server Component용)
 *
 * React.cache()는 page.tsx에서 적용합니다.
 * 이 함수 자체는 순수 fetch로 유지하여 캐시 전략을 호출부에서 결정합니다.
 *
 * @param query - 부적합 조회 쿼리 (equipmentId, status 등)
 * @returns 페이지네이션된 부적합 목록
 */
export async function getNonConformances(
  query: NonConformanceQuery = {}
): Promise<PaginatedResponse<NonConformance>> {
  const apiClient = await createServerApiClient();
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  const url = `${API_ENDPOINTS.NON_CONFORMANCES.LIST}${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await apiClient.get(url);
  return transformPaginatedResponse<NonConformance>(response);
}

/**
 * 부적합 상세 조회 (Server Component용)
 *
 * @param id - 부적합 UUID
 * @returns 부적합 상세
 */
export async function getNonConformance(id: string): Promise<NonConformance> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.get(API_ENDPOINTS.NON_CONFORMANCES.GET(id));
  return response.data;
}
