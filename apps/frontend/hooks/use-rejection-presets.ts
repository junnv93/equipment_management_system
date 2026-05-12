'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/api-client';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { type RejectionPreset } from '@/lib/api/checkout-api';

async function fetchRejectionPresets(): Promise<RejectionPreset[]> {
  const { data } = await apiClient<RejectionPreset[]>(API_ENDPOINTS.CHECKOUTS.REJECTION_PRESETS);
  return data;
}

/**
 * 반려 사유 프리셋 조회 훅.
 *
 * SSOT:
 * - queryKey: `queryKeys.checkouts.resource.rejectionPresets()` (admin mutation invalidate 일치)
 * - staleTime: CACHE_TIMES.DAY — 참조 데이터, 변경 시 backend가 cache delete
 * - 타입: `RejectionPreset` (`checkout-api.ts` SSOT — id/label/template/isDefault/sortOrder)
 */
export function useRejectionPresets() {
  return useQuery({
    queryKey: queryKeys.checkouts.resource.rejectionPresets(),
    queryFn: fetchRejectionPresets,
    staleTime: CACHE_TIMES.DAY,
  });
}
