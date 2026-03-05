'use client';

import { useState, useCallback, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RejectReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
  title?: string;
  description?: string;
  children?: ReactNode;
}

/**
 * 반려 사유 입력 다이얼로그
 *
 * 모든 승인 페이지에서 공통으로 사용하는 반려 사유 입력 Dialog.
 * children prop으로 상세 정보 프리뷰를 추가할 수 있습니다.
 */
export function RejectReasonDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  title,
  description,
  children,
}: RejectReasonDialogProps) {
  const t = useTranslations('approvals');
  const [reason, setReason] = useState('');

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setReason('');
  }, [onOpenChange]);

  const handleConfirm = useCallback(() => {
    if (!reason.trim()) return;
    onConfirm(reason);
    setReason('');
  }, [reason, onConfirm]);

  const dialogTitle = title ?? t('rejectModal.defaultTitle');
  const dialogDescription = description ?? t('rejectModal.defaultDescription');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {children}
          <div className="space-y-2">
            <Label htmlFor="rejectionReason">{t('rejectModal.reasonRequired')}</Label>
            <Textarea
              id="rejectionReason"
              placeholder={t('rejectModal.reasonPlaceholder')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('actions.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim() || isPending}
          >
            {t('actions.reject')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
