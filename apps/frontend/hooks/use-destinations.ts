'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/api-client';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';

async function fetchDestinations(): Promise<string[]> {
  const { data } = await apiClient<string[]>(API_ENDPOINTS.CHECKOUTS.DESTINATIONS);
  return data;
}

/**
 * 반출지 전체 목록 훅 (SH-6 entity 테이블 기반).
 *
 * - checkout_destinations.is_active=true 행만 반환 (백엔드 필터링)
 * - useRecentDestinations(개인 이력 5건)와 달리 전체 관리 목록 제공
 *
 * SSOT: queryKeys.checkouts.resource.destinations + CACHE_TIMES.DAY
 */
export function useDestinations() {
  return useQuery({
    queryKey: queryKeys.checkouts.resource.destinations(),
    queryFn: fetchDestinations,
    staleTime: CACHE_TIMES.DAY,
  });
}
