'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';

import { useToast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { revokeApproval } from '@/lib/api/checkout-revoke-approval';
import checkoutApi from '@/lib/api/checkout-api';
import { SYSTEM_UNDO_REVOCATION_REASON } from '@equipment-management/schemas';
import { UNDO_TOAST_DURATION_MS } from '@/lib/checkouts/undo-constants';

// 단건/벌크 양쪽 hook 이 공유하는 SSOT 상수는 `lib/checkouts/undo-constants` 로 이동.
// 본 파일은 axios(checkout-revoke-approval)에 의존하므로 jest 환경에서 import chain
// 진입을 피해야 하는 호출자(bulk hook)는 별도 파일(use-bulk-undo-toast)에서 분리.
export { UNDO_TOAST_DURATION_MS };

interface UseUndoToastOptions {
  checkoutId: string;
  /** invalidateQueries after undo — SSOT rollback 경로 */
  invalidateKeys: readonly QueryKey[];
  /** undoWindowMs 경과 전 abort 함수 */
  abortUndo: () => void;
}

/**
 * 반출 승인 Undo 토스트 훅 (단건).
 *
 * - abortUndo: undoWindowMs 내 undo → API 호출 취소
 * - revokeApproval: 이미 처리된 승인 철회 (5분 내) — SSOT API client `checkout-revoke-approval.ts`.
 *   backend `revokeApprovalSchema` 정합: `{ version, reason }` 필수. 시스템 자동 트리거이므로
 *   fresh version 은 `checkoutApi.getCheckout` 으로 확보, reason 은 `SYSTEM_UNDO_REVOCATION_REASON`
 *   (packages/schemas SSOT — backend audit log 에 시스템 액션 명시).
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
              // fresh version 확보 — 5초 윈도우 내 다른 mutation race 회피
              const { version } = await checkoutApi.getCheckout(checkoutId);
              await revokeApproval(checkoutId, {
                version,
                reason: SYSTEM_UNDO_REVOCATION_REASON,
              });
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
