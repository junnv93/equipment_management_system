'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import RejectModal from '@/components/approvals/RejectModal';
import { BulkActionBar as GenericBulkActionBar } from '@/components/common/BulkActionBar';
import { APPROVAL_BULK_BAR_TOKENS, getApprovalActionButtonClasses } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

interface CheckoutBulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  isAllPageSelected: boolean;
  isIndeterminate: boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
  /**
   * 일괄 승인 콜백 — `Promise<void>` 강제 (mutate fire-and-forget 금지).
   *
   * AlertDialog 내부 `handleBulkApprove`가 `await onBulkApprove()` 후 close하므로,
   * 호출자는 반드시 `mutation.mutateAsync()`를 await/return해야 한다.
   * `() => void` 콜백을 전달하면 dialog가 API 응답 전 즉시 close + isPending 시각 피드백 유실.
   */
  onBulkApprove: () => Promise<void>;
  onBulkReject?: (reason: string) => Promise<void>;
  isPending?: boolean;
}

export function CheckoutBulkActionBar({
  selectedCount,
  totalCount,
  isAllPageSelected,
  isIndeterminate,
  onSelectAll,
  onClearSelection,
  onBulkApprove,
  onBulkReject,
  isPending = false,
}: CheckoutBulkActionBarProps) {
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const t = useTranslations('checkouts');
  const tApprovals = useTranslations('approvals');
  const isVisible = selectedCount > 0;

  const handleBulkApprove = async () => {
    setIsProcessing(true);
    try {
      await onBulkApprove();
      setIsApproveDialogOpen(false);
    } catch {
      // mutateAsync reject (네트워크/서버 5xx) — error toast는 useOptimisticMutation onError에서
      // 표시. dialog는 유지하여 사용자가 cancel/retry 결정 가능. unhandled rejection 차단.
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isVisible
          ? tApprovals('bulkBar.selectionCount', { count: selectedCount })
          : tApprovals('bulkBar.selectionCleared')}
      </div>

      <div
        className={cn(
          APPROVAL_BULK_BAR_TOKENS.fixedBottom,
          isVisible ? APPROVAL_BULK_BAR_TOKENS.visible : APPROVAL_BULK_BAR_TOKENS.hidden
        )}
        aria-hidden={!isVisible}
        data-testid="bulk-action-bar"
      >
        {isVisible && (
          <GenericBulkActionBar
            selectedCount={selectedCount}
            totalCount={totalCount}
            isAllPageSelected={isAllPageSelected}
            isIndeterminate={isIndeterminate}
            onSelectAll={onSelectAll}
            onClear={onClearSelection}
            variant="inline"
            ariaLabel={t('bulk.ariaLabel')}
            className={APPROVAL_BULK_BAR_TOKENS.genericOverride}
            actions={
              <>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsApproveDialogOpen(true)}
                  disabled={isPending}
                  className={getApprovalActionButtonClasses('approve')}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  {t('bulk.approve')} ({selectedCount})
                </Button>
                {onBulkReject && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsRejectModalOpen(true)}
                    disabled={isPending}
                    className={getApprovalActionButtonClasses('reject')}
                  >
                    <XCircle className="h-4 w-4 mr-1.5" aria-hidden="true" />
                    {t('bulk.reject')}
                  </Button>
                )}
              </>
            }
          />
        )}
      </div>

      <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('bulk.confirmApproveTitle', { count: selectedCount })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('bulk.confirmApproveDescription', { count: selectedCount })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              {tApprovals('actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkApprove}
              disabled={isProcessing}
              className={getApprovalActionButtonClasses('approve')}
            >
              {isProcessing ? tApprovals('processing') : t('bulk.approve')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {onBulkReject && (
        <RejectModal
          mode="bulk"
          count={selectedCount}
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          onBulkConfirm={onBulkReject}
        />
      )}
    </>
  );
}
