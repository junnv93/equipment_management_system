'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/api-client';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';

interface SavedViewCounts {
  all: number;
  pendingApproval: number;
  overdue: number;
}

async function fetchSavedViewCounts(): Promise<SavedViewCounts> {
  const { data } = await apiClient.get<SavedViewCounts>(API_ENDPOINTS.CHECKOUTS.SAVED_VIEW_COUNTS);
  return data;
}

/**
 * 시스템 뷰별 건수 조회 훅.
 * SSOT: queryKeys.checkouts.resource.savedViewCounts
 */
export function useSavedViewCounts() {
  return useQuery({
    queryKey: queryKeys.checkouts.resource.savedViewCounts(),
    queryFn: fetchSavedViewCounts,
    ...QUERY_CONFIG.CHECKOUT_SUMMARY,
  });
}
