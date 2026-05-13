'use client';

/**
 * useCheckoutBulkReceiveMutation — 반입 일괄 수령 확인 mutation hook
 *
 * inbound-bulk-receive-integration (2026-05-13):
 * - borrower_receive 단계 고정, Promise.allSettled 기반 부분 실패 허용
 * - invalidateKeys: checkouts.all + equipment.all + inbound-overview view
 * - Undo WON'T-DO: condition-check revert(record 삭제 + status 롤백) 복잡
 */

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { queryKeys } from '@/lib/api/query-config';
import checkoutApi from '@/lib/api/checkout-api';
import type { ConditionStatus, AccessoriesStatus } from '@equipment-management/schemas';
import { useMutation } from '@tanstack/react-query';

export interface BulkReceiveCondition {
  appearanceStatus: ConditionStatus;
  operationStatus: ConditionStatus;
  accessoriesStatus?: AccessoriesStatus;
  abnormalDetails?: string;
  notes?: string;
}

interface UseCheckoutBulkReceiveMutationParams {
  selection: {
    count: number;
    selected: ReadonlySet<string>;
    clear: () => void;
  };
}

export interface BulkReceiveMutation {
  isPending: boolean;
  handleBulkReceive: (condition: BulkReceiveCondition) => Promise<void>;
}

const RECEIVE_INVALIDATE_KEYS: ReadonlyArray<readonly unknown[]> = [
  queryKeys.checkouts.all, // view.inboundOverview + resource.* 전체
  queryKeys.equipment.all, // borrower_receive 후 장비 IN_USE 전이 반영
];

export function useCheckoutBulkReceiveMutation({
  selection,
}: UseCheckoutBulkReceiveMutationParams): BulkReceiveMutation {
  const t = useTranslations('checkouts');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (vars: { ids: string[]; condition: BulkReceiveCondition }) =>
      checkoutApi.bulkReceiveCheckouts(vars.ids, vars.condition),
    onSuccess: (result) => {
      const successCount = result.received.length;
      const failedCount = result.failed.length;

      if (failedCount > 0 && successCount === 0) {
        toast({
          title: t('inbound.bulk.receiveError'),
          description: t('inbound.bulk.receiveResult', { success: 0, failed: failedCount }),
          variant: 'destructive',
        });
      } else if (failedCount > 0) {
        toast({
          title: t('inbound.bulk.receiveResult', { success: successCount, failed: failedCount }),
          variant: 'destructive',
        });
      } else {
        toast({ title: t('inbound.bulk.receiveAll', { count: successCount }) });
      }

      selection.clear();

      // 수령 완료 후 관련 쿼리 무효화 — inbound-overview BFF는 checkouts.all prefix에 포함
      for (const key of RECEIVE_INVALIDATE_KEYS) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    },
    onError: () => {
      toast({
        title: t('inbound.bulk.receiveError'),
        variant: 'destructive',
      });
    },
  });

  const handleBulkReceive = useCallback(
    async (condition: BulkReceiveCondition) => {
      if (selection.count === 0) return;
      await mutation.mutateAsync({ ids: Array.from(selection.selected), condition });
    },
    [mutation, selection]
  );

  return {
    isPending: mutation.isPending,
    handleBulkReceive,
  };
}
