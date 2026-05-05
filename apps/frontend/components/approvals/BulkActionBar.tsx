'use client';

import { useState } from 'react';
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
import RejectModal from './RejectModal';
import { BulkActionBar as GenericBulkActionBar } from '@/components/common/BulkActionBar';
import { APPROVAL_BULK_BAR_TOKENS, getApprovalActionButtonClasses } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  /** useRowSelection.isAllPageSelected — 전체 페이지 선택 여부 */
  isAllPageSelected: boolean;
  /** useRowSelection.isIndeterminate — 부분 선택 여부 (master checkbox 'mixed' 상태) */
  isIndeterminate: boolean;
  /** useRowSelection.selectAllOnPage — 전체 선택 핸들러 */
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
  /** canReject: false 카테고리(inspection 등)에서 undefined — 반려 버튼 + 모달 미표시 (AR-8) */
  onBulkReject?: (reason: string) => Promise<void>;
  actionLabel: string;
}

/**
 * BulkActionBar — fixed bottom floating action bar (AP-02/03)
 *
 * common/BulkActionBar wrapper:
 * - 포지셔닝/DOM 지속: APPROVAL_BULK_BAR_TOKENS.fixedBottom + aria-hidden 토글
 * - 선택 UI (master checkbox·indeterminate·카운트·해제): GenericBulkActionBar SSOT
 * - 도메인 액션: approve/reject 버튼 → actions slot 주입
 *
 * 0건 → aria-hidden=true (DOM 유지 — SR 접근 가능)
 * ≥1건 → aria-hidden=false (200ms fade-in)
 */
export function BulkActionBar({
  selectedCount,
  totalCount,
  isAllPageSelected,
  isIndeterminate,
  onSelectAll,
  onClearSelection,
  onBulkApprove,
  onBulkReject,
  actionLabel,
}: BulkActionBarProps) {
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const t = useTranslations('approvals');
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
      {/* SR 전용 라이브 영역 — 선택 변동 공지 (DOM 항상 유지) */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isVisible
          ? t('bulkBar.selectionCount', { count: selectedCount })
          : t('bulkBar.selectionCleared')}
      </div>

      {/* Fixed bottom floating — DOM 유지 (aria-hidden 토글, 200ms transition) */}
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
            ariaLabel={t('bulkBar.ariaLabel')}
            className={APPROVAL_BULK_BAR_TOKENS.genericOverride}
            actions={
              <>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsApproveDialogOpen(true)}
                  className={getApprovalActionButtonClasses('approve')}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  {actionLabel} ({selectedCount})
                </Button>
                {onBulkReject && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsRejectModalOpen(true)}
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

      {/* 일괄 승인 확인 다이얼로그 */}
      <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('bulk.confirmTitle', { action: actionLabel })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('bulk.confirmDescription', { action: actionLabel, count: selectedCount })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkApprove}
              disabled={isProcessing}
              className={getApprovalActionButtonClasses('approve')}
            >
              {isProcessing ? t('processing') : actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 일괄 반려 — RejectModal(mode='bulk') / onBulkReject 없으면 미표시 (AR-8) */}
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
