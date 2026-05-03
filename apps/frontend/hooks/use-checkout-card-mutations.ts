/**
 * Checkout Card Mutations — useOptimisticMutation SSOT 채택
 *
 * CheckoutGroupCard에서 인라인으로 운용되던 approve / borrowerApprove mutation을
 * use-equipment.ts와 동일한 useOptimisticMutation 패턴으로 추출한 SSOT 훅.
 *
 * - setQueryData 직접 호출 0건 (verify-frontend-state Step 35 PASS)
 * - CAS 409 시 detail 캐시 제거 보존 (onErrorCallback)
 * - notifyCheckoutAction 토스트 템플릿 보존 (onSuccessCallback)
 * - APPROVAL_KEYS 5축 무효화 보존 (invalidateKeys)
 */

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from '@/components/ui/use-toast';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import checkoutApi, { type Checkout, type CheckoutSummary } from '@/lib/api/checkout-api';
import type { PaginatedResponse } from '@/lib/api/types';
import { CheckoutCacheInvalidation } from '@/lib/api/cache-invalidation';
import { isConflictError } from '@/lib/api/error';
import { queryKeys } from '@/lib/api/query-config';
import { notifyCheckoutAction } from '@/lib/checkouts/toast-templates';
import { CheckoutStatusValues as CSVal } from '@equipment-management/schemas';

type ApproveCheckoutVariables = {
  id: string;
  equipmentName?: string;
};

type CheckoutListCache = PaginatedResponse<Checkout, CheckoutSummary>;

const VIEW_ALL_KEY = queryKeys.checkouts.view.all();
const APPROVAL_INVALIDATE_KEYS = [...CheckoutCacheInvalidation.APPROVAL_KEYS];

/**
 * 승인 mutation — TM/QA가 PENDING 반출 요청을 승인.
 *
 * 승인 후 상태 전이: PENDING → APPROVED.
 * CAS 409 충돌 시 detail 캐시를 즉시 삭제하여 재시도 시 fresh version을 강제.
 */
export function useApproveCheckoutMutation() {
  const queryClient = useQueryClient();
  const t = useTranslations('checkouts');

  return useOptimisticMutation<Checkout, ApproveCheckoutVariables, CheckoutListCache>({
    mutationFn: async ({ id }) => {
      const { version } = await checkoutApi.getCheckout(id);
      return checkoutApi.approveCheckout(id, version);
    },
    queryKey: VIEW_ALL_KEY,
    optimisticUpdateScope: 'matching',
    optimisticUpdate: (old, { id }) => {
      if (!old?.data) return old as CheckoutListCache;
      return {
        ...old,
        data: old.data.map((co) => (co.id === id ? { ...co, status: CSVal.APPROVED } : co)),
      };
    },
    invalidateKeys: APPROVAL_INVALIDATE_KEYS,
    onSuccessCallback: (_data, variables) => {
      notifyCheckoutAction(toast, 'approve', { equipmentName: variables.equipmentName ?? '' }, t);
    },
    onErrorCallback: (error, variables) => {
      // CAS 409: detail 캐시 즉시 제거 → 재시도 시 fresh version 조회 보장
      if (isConflictError(error)) {
        queryClient.removeQueries({ queryKey: queryKeys.checkouts.resource.detail(variables.id) });
      }
    },
  });
}

/**
 * Borrower 승인 mutation — 차용자(borrower) 측 1차 승인.
 *
 * Rental 2-step flow의 첫 단계: PENDING → BORROWER_APPROVED.
 * CAS 409 충돌 시 detail 캐시를 삭제하여 재시도 시 fresh version 강제.
 */
export function useBorrowerApproveCheckoutMutation() {
  const queryClient = useQueryClient();
  const t = useTranslations('checkouts');

  return useOptimisticMutation<Checkout, ApproveCheckoutVariables, CheckoutListCache>({
    mutationFn: async ({ id }) => {
      const { version } = await checkoutApi.getCheckout(id);
      return checkoutApi.borrowerApproveCheckout(id, version);
    },
    queryKey: VIEW_ALL_KEY,
    optimisticUpdateScope: 'matching',
    optimisticUpdate: (old, { id }) => {
      if (!old?.data) return old as CheckoutListCache;
      return {
        ...old,
        data: old.data.map((co) =>
          co.id === id ? { ...co, status: CSVal.BORROWER_APPROVED } : co
        ),
      };
    },
    invalidateKeys: APPROVAL_INVALIDATE_KEYS,
    onSuccessCallback: (_data, variables) => {
      notifyCheckoutAction(
        toast,
        'borrower_approve',
        { equipmentName: variables.equipmentName ?? '' },
        t
      );
    },
    onErrorCallback: (error, variables) => {
      if (isConflictError(error)) {
        queryClient.removeQueries({ queryKey: queryKeys.checkouts.resource.detail(variables.id) });
      }
    },
  });
}
