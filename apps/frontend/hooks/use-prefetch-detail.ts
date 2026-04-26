'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import equipmentApi from '@/lib/api/equipment-api';
import checkoutApi from '@/lib/api/checkout-api';

/**
 * 목록→상세 네비게이션 prefetch hook
 *
 * 마우스 hover 시 상세 데이터를 미리 캐시에 로드하여
 * 클릭 후 페이지 전환 시 즉시 렌더링할 수 있도록 합니다.
 *
 * @example
 * const { prefetchEquipment } = usePrefetchDetail();
 * <Link onMouseEnter={() => prefetchEquipment(id)} href={`/equipment/${id}`}>
 */
export function usePrefetchDetail() {
  const queryClient = useQueryClient();

  const prefetchEquipment = useCallback(
    (id: string) => {
      void queryClient.prefetchQuery({
        queryKey: queryKeys.equipment.detail(id),
        queryFn: () => equipmentApi.getById(id),
        staleTime: CACHE_TIMES.MEDIUM,
      });
    },
    [queryClient]
  );

  const prefetchCheckout = useCallback(
    (id: string) => {
      void queryClient.prefetchQuery({
        queryKey: queryKeys.checkouts.resource.detail(id),
        queryFn: () => checkoutApi.getCheckout(id),
        staleTime: CACHE_TIMES.MEDIUM,
      });
    },
    [queryClient]
  );

  return { prefetchEquipment, prefetchCheckout };
}
