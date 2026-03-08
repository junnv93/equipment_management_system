'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { APPROVAL_BULK_BAR_TOKENS, getApprovalActionButtonClasses } from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onBulkApprove: () => void | Promise<void>;
  onBulkReject: (reason: string) => Promise<void>;
  actionLabel: string;
}

export function BulkActionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onBulkApprove,
  onBulkReject,
  actionLabel,
}: BulkActionBarProps) {
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const t = useTranslations('approvals');

  const isAllSelected = selectedCount === totalCount && totalCount > 0;
  const hasSelection = selectedCount > 0;

  const handleBulkApprove = async () => {
    setIsProcessing(true);
    try {
      await onBulkApprove();
      setIsApproveDialogOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (!rejectReason.trim() || rejectReason.length < 10) {
      return;
    }

    setIsProcessing(true);
    try {
      await onBulkReject(rejectReason);
      setIsRejectDialogOpen(false);
      setRejectReason('');
    } finally {
      setIsProcessing(false);
    }
  };

  if (totalCount === 0) {
    return null;
  }

  return (
    <div
      className={`flex items-center justify-between py-3 px-4 rounded-lg ${APPROVAL_BULK_BAR_TOKENS.container}`}
    >
      {/* 전체 선택 */}
      <div className="flex items-center gap-3">
        <Checkbox
          id="select-all"
          checked={isAllSelected}
          onCheckedChange={onSelectAll}
          aria-label={isAllSelected ? t('bulk.deselectAll') : t('bulk.selectAll')}
        />
        <Label htmlFor="select-all" className="text-sm cursor-pointer">
          {t('bulk.selectAll')} ({selectedCount}/{totalCount})
        </Label>
      </div>

      {/* 일괄 처리 버튼 */}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!hasSelection}
          onClick={() => setIsApproveDialogOpen(true)}
          className={getApprovalActionButtonClasses('approve')}
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          {t('bulk.action', { action: actionLabel })}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!hasSelection}
          onClick={() => setIsRejectDialogOpen(true)}
          className={getApprovalActionButtonClasses('reject')}
        >
          <XCircle className="h-4 w-4 mr-1" />
          {t('bulk.reject')}
        </Button>
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

      {/* 일괄 반려 다이얼로그 */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('bulk.reject')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('bulk.rejectDescription', { count: selectedCount })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="bulk-reject-reason">{t('rejectModal.reasonLabel')}</Label>
            <Textarea
              id="bulk-reject-reason"
              placeholder={t('rejectModal.reasonPlaceholder')}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-2 min-h-[100px]"
            />
            {rejectReason.length > 0 && rejectReason.length < 10 && (
              <p className="text-sm text-destructive mt-1" role="alert">
                {t('bulk.rejectValidation')} ({rejectReason.length}/10)
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkReject}
              disabled={isProcessing || rejectReason.length < 10}
              className={getApprovalActionButtonClasses('reject')}
            >
              {isProcessing ? t('processing') : t('actions.reject')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
