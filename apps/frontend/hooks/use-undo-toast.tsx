'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';

import { useToast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { revokeApproval } from '@/lib/api/checkout-revoke-approval';

/** undo 토스트 표시 시간 — CheckoutDetailClient.tsx의 undoWindowMs: 5000과 동기화 */
const UNDO_TOAST_DURATION_MS = 5000;

interface UseUndoToastOptions {
  checkoutId: string;
  /** invalidateQueries after undo — SSOT rollback 경로 */
  invalidateKeys: QueryKey[];
  /** undoWindowMs 경과 전 abort 함수 */
  abortUndo: () => void;
}

/**
 * 반출 승인 Undo 토스트 훅.
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
