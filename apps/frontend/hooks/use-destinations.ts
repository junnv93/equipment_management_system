'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import checkoutApi from '@/lib/api/checkout-api';

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
    queryFn: () => checkoutApi.getDestinations(),
    ...QUERY_CONFIG.CHECKOUT_DESTINATIONS,
  });
}

/**
 * 반출지 등록 mutation (SH-6 인라인 create 플로우).
 *
 * - 중복 이름: backend onConflict upsert → 기존 entity 반환
 * - onSuccess: destinations 캐시 invalidate → 목록 즉시 갱신
 */
export function useCreateDestination() {
  const queryClient = useQueryClient();
  return useMutation<string, Error, string>({
    mutationFn: (name: string) => checkoutApi.createDestination(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.checkouts.resource.destinations() });
    },
  });
}
