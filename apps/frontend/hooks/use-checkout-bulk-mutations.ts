'use client';

/**
 * useCheckoutBulkMutations — 반출 일괄 승인/반려 mutation hook (SSOT 추출)
 *
 * tab-component-split-sprint (2026-05-06): OutboundCheckoutsTab.tsx 789줄 SRP 위반 해소.
 * Bulk approve/reject mutation을 분리해 컴포넌트는 selection 토글/렌더만 담당.
 *
 * 동작 동일성:
 * - useOptimisticMutation + invalidateKeys: CheckoutCacheInvalidation.APPROVAL_KEYS 보존
 * - 부분 실패 토스트 분기 (전체 성공 / 부분 성공 / 전체 실패) 보존
 * - selection.clear() onSuccess 보존
 * - track('checkout.bulk_approve'/'bulk_reject') analytics SSOT 호출 보존
 */

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { useBulkUndoToast } from '@/hooks/use-bulk-undo-toast';
import { UNDO_TOAST_DURATION_MS } from '@/lib/checkouts/undo-constants';
import { CheckoutCacheInvalidation } from '@/lib/api/cache-invalidation';
import { queryKeys } from '@/lib/api/query-config';
import { track } from '@/lib/analytics/track';
import checkoutApi, { type Checkout, type CheckoutQuery } from '@/lib/api/checkout-api';
import { CheckoutDirectionValues as CDVal } from '@equipment-management/schemas';

interface UseCheckoutBulkMutationsParams {
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
  selection: {
    count: number;
    selected: ReadonlySet<string>;
    clear: () => void;
  };
}

export interface BulkMutations {
  isPending: boolean;
  handleBulkApprove: () => Promise<void>;
  handleBulkReject: (reason: string) => Promise<void>;
}

export function useCheckoutBulkMutations({
  apiParams,
  teamId,
  selection,
}: UseCheckoutBulkMutationsParams): BulkMutations {
  const t = useTranslations('checkouts');
  const { toast } = useToast();

  const queryKey = queryKeys.checkouts.view.outbound({
    direction: CDVal.OUTBOUND,
    ...apiParams,
    teamId,
  });

  const bulkApproveMutation = useOptimisticMutation<
    { approved: { id: string; version: number }[]; failed: { id: string; error: string }[] },
    { ids: string[] },
    readonly Checkout[]
  >({
    mutationFn: async ({ ids }) => checkoutApi.bulkApproveCheckouts(ids),
    queryKey,
    optimisticUpdate: (old) => old ?? [],
    invalidateKeys: CheckoutCacheInvalidation.APPROVAL_KEYS,
    errorMessage: t('bulk.approveError'),
    undoWindowMs: UNDO_TOAST_DURATION_MS,
    onSuccessCallback: (result) => {
      const successCount = result.approved.length;
      const failedCount = result.failed.length;
      if (failedCount > 0 && successCount === 0) {
        toast({
          title: t('bulk.approveError'),
          description: t('bulk.approveResult', { success: 0, failed: failedCount }),
          variant: 'destructive',
        });
      } else if (failedCount > 0) {
        toast({
          title: t('bulk.approveResult', { success: successCount, failed: failedCount }),
          variant: 'destructive',
        });
      } else {
        toast({ title: t('bulk.approveAll', { count: successCount }) });
      }
      selection.clear();
    },
  });

  const bulkRejectMutation = useOptimisticMutation<
    { rejected: { id: string; version: number }[]; failed: { id: string; error: string }[] },
    { ids: string[]; reason: string },
    readonly Checkout[]
  >({
    mutationFn: async ({ ids, reason }) => checkoutApi.bulkRejectCheckouts(ids, reason),
    queryKey,
    optimisticUpdate: (old) => old ?? [],
    invalidateKeys: CheckoutCacheInvalidation.APPROVAL_KEYS,
    errorMessage: t('bulk.rejectError'),
    undoWindowMs: UNDO_TOAST_DURATION_MS,
    onSuccessCallback: (result) => {
      const successCount = result.rejected.length;
      const failedCount = result.failed.length;
      if (failedCount > 0 && successCount === 0) {
        toast({
          title: t('bulk.rejectError'),
          description: t('bulk.rejectResult', { success: 0, failed: failedCount }),
          variant: 'destructive',
        });
      } else if (failedCount > 0) {
        toast({
          title: t('bulk.rejectResult', { success: successCount, failed: failedCount }),
          variant: 'destructive',
        });
      } else {
        toast({ title: t('bulk.rejectAll', { count: successCount }) });
      }
      selection.clear();
    },
  });

  // 각 mutation은 abortUndo가 다르므로 hook을 2회 호출 (1회 = 1 abort 핸들)
  const { showBulkApproveUndoToast } = useBulkUndoToast({
    invalidateKeys: CheckoutCacheInvalidation.APPROVAL_KEYS,
    abortUndo: bulkApproveMutation.abortUndo,
  });
  const { showBulkRejectUndoToast } = useBulkUndoToast({
    invalidateKeys: CheckoutCacheInvalidation.APPROVAL_KEYS,
    abortUndo: bulkRejectMutation.abortUndo,
  });

  // undoWindowMs 적용 후 mutateAsync는 5초 pending. 호출자(dialog)가 await하면 5초간 닫히지 않으므로
  // fire-and-forget 패턴 사용 — toast가 즉시 표시되고 dialog는 즉시 close.
  // AbortError(undo 클릭)는 정상 흐름이므로 catch swallow.
  const handleBulkApprove = useCallback(async () => {
    if (selection.count === 0) return;
    const count = selection.count;
    track('checkout.bulk_approve', { count });
    showBulkApproveUndoToast(count);
    void bulkApproveMutation
      .mutateAsync({ ids: Array.from(selection.selected) })
      .catch(() => undefined);
  }, [bulkApproveMutation, selection, showBulkApproveUndoToast]);

  const handleBulkReject = useCallback(
    async (reason: string) => {
      if (selection.count === 0) return;
      const count = selection.count;
      track('checkout.bulk_reject', { count });
      showBulkRejectUndoToast(count);
      void bulkRejectMutation
        .mutateAsync({ ids: Array.from(selection.selected), reason })
        .catch(() => undefined);
    },
    [bulkRejectMutation, selection, showBulkRejectUndoToast]
  );

  return {
    isPending: bulkApproveMutation.isPending || bulkRejectMutation.isPending,
    handleBulkApprove,
    handleBulkReject,
  };
}
