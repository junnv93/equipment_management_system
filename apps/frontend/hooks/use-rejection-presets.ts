'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/api-client';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';

interface RejectionPreset {
  id: string;
  text: string;
  category?: string;
}

async function fetchRejectionPresets(): Promise<RejectionPreset[]> {
  const { data } = await apiClient<RejectionPreset[]>(API_ENDPOINTS.CHECKOUTS.REJECTION_PRESETS);
  return data;
}

/**
 * 반려 사유 프리셋 조회 훅.
 *
 * SSOT: queryKeys.checkouts.resource.rejectionPresets + CACHE_TIMES.DAY
 * 프리셋은 참조 데이터 — 하루 단위 캐싱으로 불필요한 재요청 방지.
 */
export function useRejectionPresets() {
  return useQuery({
    queryKey: queryKeys.checkouts.resource.rejectionPresets(),
    queryFn: fetchRejectionPresets,
    staleTime: CACHE_TIMES.DAY,
  });
}
