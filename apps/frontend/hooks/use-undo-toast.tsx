'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';

import { useToast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { revokeApproval } from '@/lib/api/checkout-revoke-approval';

/** undo 토스트 표시 시간 — CheckoutDetailClient.tsx의 undoWindowMs: 5000과 동기화 */
export const UNDO_TOAST_DURATION_MS = 5000;

interface UseUndoToastOptions {
  checkoutId: string;
  /** invalidateQueries after undo — SSOT rollback 경로 */
  invalidateKeys: QueryKey[];
  /** undoWindowMs 경과 전 abort 함수 */
  abortUndo: () => void;
}

/**
 * 반출 승인 Undo 토스트 훅 (단건).
 *
 * - abortUndo: undoWindowMs 내 undo → API 호출 취소
 * - revokeApproval: 이미 처리된 승인 철회 (5분 내)
 * - cache rollback = invalidateQueries 전용 (setQueryData 금지)
 *
 * ARIA: Radix Toast 기본 type="foreground" → role="status" + aria-live="polite"
 */
export function useUndoToast({ checkoutId, invalidateKeys, abortUndo }: UseUndoToastOptions) {
  const { toast } = useToast();
  const t = useTranslations('checkouts.undo.toast');
  const queryClient = useQueryClient();

  const showApprovalUndoToast = useCallback(() => {
    toast({
      description: t('approved'),
      duration: UNDO_TOAST_DURATION_MS,
      action: (
        <ToastAction
          altText={t('undo')}
          onClick={async () => {
            abortUndo();
            try {
              await revokeApproval(checkoutId);
              const invalidations = invalidateKeys.map((key) =>
                queryClient.invalidateQueries({ queryKey: key })
              );
              await Promise.all(invalidations);
              toast({ description: t('undoSuccess') });
            } catch {
              toast({ description: t('undoError'), variant: 'destructive' });
            }
          }}
        >
          {t('undo')}
        </ToastAction>
      ),
    });
  }, [toast, t, checkoutId, abortUndo, invalidateKeys, queryClient]);

  return { showApprovalUndoToast };
}

interface UseBulkUndoToastOptions {
  /** invalidateQueries after undo — optimistic rollback 보장 */
  invalidateKeys: QueryKey[];
  /** undoWindowMs 내 abort 함수 (서버 호출 자체 취소) */
  abortUndo: () => void;
}

/**
 * 일괄 액션 Undo 토스트 훅.
 *
 * 단건 useUndoToast와의 차이:
 * - revokeApproval 미호출 — 5초 내 abortUndo만 (bulk-revoke API 미존재, 5초 초과 후엔 일반 mutate 흐름)
 * - 5초 지연 = ALL-OR-NOTHING (전체 N건 미실행 또는 전체 N건 실행)
 * - 부분 실패 케이스에는 사용 금지 (부분 실패 → destructive toast 우선)
 */
export function useBulkUndoToast({ invalidateKeys, abortUndo }: UseBulkUndoToastOptions) {
  const { toast } = useToast();
  const t = useTranslations('checkouts.undo.toast');
  const queryClient = useQueryClient();

  const show = useCallback(
    (kind: 'approve' | 'reject', count: number) => {
      const messageKey = kind === 'approve' ? 'bulkApproved' : 'bulkRejected';
      toast({
        description: t(messageKey, { count }),
        duration: UNDO_TOAST_DURATION_MS,
        action: (
          <ToastAction
            altText={t('bulkUndo')}
            onClick={async () => {
              abortUndo();
              const invalidations = invalidateKeys.map((key) =>
                queryClient.invalidateQueries({ queryKey: key })
              );
              await Promise.all(invalidations);
              toast({ description: t('bulkUndoSuccess') });
            }}
          >
            {t('bulkUndo')}
          </ToastAction>
        ),
      });
    },
    [toast, t, abortUndo, invalidateKeys, queryClient]
  );

  return {
    showBulkApproveUndoToast: useCallback((count: number) => show('approve', count), [show]),
    showBulkRejectUndoToast: useCallback((count: number) => show('reject', count), [show]),
  };
}
