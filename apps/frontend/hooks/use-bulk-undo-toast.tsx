'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';

import { useToast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { UNDO_TOAST_DURATION_MS } from '@/lib/checkouts/undo-constants';

interface UseBulkUndoToastOptions {
  /** invalidateQueries after undo — optimistic rollback 보장 */
  invalidateKeys: readonly QueryKey[];
  /** undoWindowMs 내 abort 함수 (서버 호출 자체 취소) */
  abortUndo: () => void;
}

/**
 * 일괄 액션 Undo 토스트 훅.
 *
 * 단건 useUndoToast와의 차이:
 * - revokeApproval (axios 경유) 미호출 — 5초 내 abortUndo 만 (bulk-revoke API 미존재).
 *   → axios import chain 회피로 jest ESM transform 이슈 차단 + 도메인 경계 분리.
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
