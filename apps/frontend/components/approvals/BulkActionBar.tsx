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
    <div className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-lg">
      {/* 전체 선택 */}
      <div className="flex items-center gap-3">
        <Checkbox
          id="select-all"
          checked={isAllSelected}
          onCheckedChange={onSelectAll}
          aria-label={isAllSelected ? '전체 선택 해제' : '전체 선택'}
        />
        <Label htmlFor="select-all" className="text-sm cursor-pointer">
          전체 선택 ({selectedCount}/{totalCount})
        </Label>
      </div>

      {/* 일괄 처리 버튼 */}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!hasSelection}
          onClick={() => setIsApproveDialogOpen(true)}
          className="bg-ul-green hover:bg-ul-green-hover text-white"
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          일괄 {actionLabel}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={!hasSelection}
          onClick={() => setIsRejectDialogOpen(true)}
          className="bg-ul-red hover:bg-ul-red-hover"
        >
          <XCircle className="h-4 w-4 mr-1" />
          일괄 반려
        </Button>
      </div>

      {/* 일괄 승인 확인 다이얼로그 */}
      <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>일괄 {actionLabel}</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 {selectedCount}개 항목을 {actionLabel}하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkApprove}
              disabled={isProcessing}
              className="bg-ul-green hover:bg-ul-green-hover"
            >
              {isProcessing ? '처리 중...' : `${actionLabel}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 일괄 반려 다이얼로그 */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>일괄 반려</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 {selectedCount}개 항목을 반려합니다. 공통 반려 사유를 입력해주세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="bulk-reject-reason">반려 사유 (10자 이상 필수)</Label>
            <Textarea
              id="bulk-reject-reason"
              placeholder="반려 사유를 입력하세요"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-2 min-h-[100px]"
            />
            {rejectReason.length > 0 && rejectReason.length < 10 && (
              <p className="text-sm text-destructive mt-1" role="alert">
                반려 사유는 10자 이상 입력해주세요. ({rejectReason.length}/10)
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkReject}
              disabled={isProcessing || rejectReason.length < 10}
              className="bg-ul-red hover:bg-ul-red-hover"
            >
              {isProcessing ? '처리 중...' : '반려'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
