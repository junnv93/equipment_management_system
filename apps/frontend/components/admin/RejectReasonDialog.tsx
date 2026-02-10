'use client';

import { useState, useCallback, type ReactNode } from 'react';
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
  title = '요청 반려',
  description = '반려 사유를 입력해주세요. 반려 사유는 필수입니다.',
  children,
}: RejectReasonDialogProps) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {children}
          <div className="space-y-2">
            <Label htmlFor="rejectionReason">반려 사유 *</Label>
            <Textarea
              id="rejectionReason"
              placeholder="반려 사유를 입력하세요"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim() || isPending}
          >
            반려
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
