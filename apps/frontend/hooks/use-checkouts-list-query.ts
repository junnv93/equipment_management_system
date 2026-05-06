'use client';

/**
 * useCheckoutsListQuery — 반출 목록 조회 hook (SSOT 추출)
 *
 * tab-component-split-sprint (2026-05-06): OutboundCheckoutsTab.tsx 789줄 SRP 위반 해소.
 * 조회 책임을 분리해 컴포넌트는 렌더링/이벤트만 담당.
 *
 * 동작 동일성: 기존 OutboundCheckoutsTab `useQuery` 호출 그대로.
 * queryKey/queryFn/QUERY_CONFIG.CHECKOUT_LIST 모두 SSOT 보존.
 */

import { useQuery } from '@tanstack/react-query';
import checkoutApi, { type CheckoutQuery } from '@/lib/api/checkout-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { CheckoutDirectionValues as CDVal } from '@equipment-management/schemas';

interface UseCheckoutsListQueryParams {
  /** convertFiltersToApiParams() 결과 — page/pageSize/search/statuses/destination/purpose/checkoutFrom/checkoutTo */
  apiParams: {
    page?: number;
    pageSize?: number;
    search?: string;
    statuses?: string;
    destination?: string;
    purpose?: CheckoutQuery['purpose'];
    checkoutFrom?: string;
    checkoutTo?: string;
  };
  teamId?: string;
}

/**
 * 반출(outbound) 목록 조회 — Outbound 탭 전용.
 * Inbound는 BFF 단일 집계 API(`getInboundOverview`) 사용으로 별도 hook 필요 없음.
 */
export function useCheckoutsListQuery({ apiParams, teamId }: UseCheckoutsListQueryParams) {
  return useQuery({
    queryKey: queryKeys.checkouts.view.outbound({
      direction: CDVal.OUTBOUND,
      ...apiParams,
      teamId,
    }),
    queryFn: async () => {
      const query: CheckoutQuery = {
        page: apiParams.page,
        pageSize: apiParams.pageSize,
        search: apiParams.search,
        teamId,
        direction: CDVal.OUTBOUND,
        includeSummary: true,
        statuses: apiParams.statuses,
        destination: apiParams.destination,
        purpose: apiParams.purpose,
        checkoutFrom: apiParams.checkoutFrom,
        checkoutTo: apiParams.checkoutTo,
      };
      return checkoutApi.getCheckouts(query);
    },
    ...QUERY_CONFIG.CHECKOUT_LIST,
  });
}
