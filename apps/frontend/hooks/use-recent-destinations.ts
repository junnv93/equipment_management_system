'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/api-client';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';

interface RecentDestination {
  destination: string;
  usedAt: string;
}

async function fetchRecentDestinations(): Promise<RecentDestination[]> {
  const { data } = await apiClient<RecentDestination[]>(
    API_ENDPOINTS.CHECKOUTS.DESTINATIONS_RECENT
  );
  return data;
}

/**
 * 최근 반출지 목록 훅.
 *
 * SSOT: queryKeys.checkouts.resource.destinationsRecent + CACHE_TIMES.DAY
 */
export function useRecentDestinations() {
  return useQuery({
    queryKey: queryKeys.checkouts.resource.destinationsRecent(),
    queryFn: fetchRecentDestinations,
    staleTime: CACHE_TIMES.DAY,
  });
}
