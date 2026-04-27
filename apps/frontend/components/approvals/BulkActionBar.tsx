'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, X } from 'lucide-react';
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
import { APPROVAL_BULK_BAR_TOKENS, getApprovalActionButtonClasses } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onBulkApprove: () => void | Promise<void>;
  onBulkReject: (reason: string) => Promise<void>;
  actionLabel: string;
}

/**
 * BulkActionBar — fixed bottom floating action bar (AP-02/03)
 *
 * 0건 → opacity-0 + pointer-events-none (DOM 유지 — 스크린리더 접근)
 * ≥1건 → opacity-1 (200ms fade-in)
 * Esc → 선택 해제 (dialog 닫힌 상태에서만)
 * 반려: RejectModal(mode='bulk')으로 통합 (AP-03)
 */
export function BulkActionBar({
  selectedCount,
  totalCount,
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
  const isAllSelected = selectedCount === totalCount && totalCount > 0;

  const selectionLabel = isAllSelected
    ? t('bulkBar.allSelected', { count: selectedCount, total: totalCount })
    : t('bulkBar.selectionCount', { count: selectedCount });

  // Esc → 선택 해제 (dialog 열려 있으면 dialog가 Esc 처리)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible && !isApproveDialogOpen && !isRejectModalOpen) {
        onClearSelection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, isApproveDialogOpen, isRejectModalOpen, onClearSelection]);

  const handleBulkApprove = async () => {
    setIsProcessing(true);
    try {
      await onBulkApprove();
      setIsApproveDialogOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* SR 전용 라이브 영역 — 선택 변동 공지 */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isVisible ? selectionLabel : t('bulkBar.selectionCleared')}
      </div>

      {/* Fixed bottom floating bar */}
      <div
        className={cn(
          APPROVAL_BULK_BAR_TOKENS.fixedBottom,
          isVisible ? APPROVAL_BULK_BAR_TOKENS.visible : APPROVAL_BULK_BAR_TOKENS.hidden
        )}
        role="toolbar"
        aria-label={t('bulkBar.ariaLabel')}
        aria-hidden={!isVisible}
        data-testid="bulk-action-bar"
      >
        <div className={APPROVAL_BULK_BAR_TOKENS.inner}>
          {/* 선택 카운트 chip */}
          <div
            role="status"
            aria-live="polite"
            className={APPROVAL_BULK_BAR_TOKENS.countChip}
            data-testid="bulk-selection-count"
          >
            {isVisible ? selectionLabel : ''}
          </div>

          {/* × 선택 해제 */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              APPROVAL_BULK_BAR_TOKENS.dismissButton,
              'text-muted-foreground hover:text-foreground'
            )}
            onClick={onClearSelection}
            aria-label={t('bulkBar.dismiss')}
            tabIndex={isVisible ? 0 : -1}
          >
            <X className="h-3 w-3 mr-1" aria-hidden="true" />
            {t('bulkBar.dismiss')}
          </Button>

          <div className="flex-1" />

          {/* 일괄 처리 버튼 */}
          <Button
            type="button"
            size="sm"
            onClick={() => setIsApproveDialogOpen(true)}
            className={getApprovalActionButtonClasses('approve')}
            tabIndex={isVisible ? 0 : -1}
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
            {actionLabel} ({selectedCount})
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIsRejectModalOpen(true)}
            className={getApprovalActionButtonClasses('reject')}
            tabIndex={isVisible ? 0 : -1}
          >
            <XCircle className="h-4 w-4 mr-1.5" aria-hidden="true" />
            {t('bulk.reject')}
          </Button>
        </div>
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

      {/* 일괄 반려 — RejectModal(mode='bulk')으로 통합 (AP-03) */}
      <RejectModal
        mode="bulk"
        count={selectedCount}
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onBulkConfirm={onBulkReject}
      />
    </>
  );
}
