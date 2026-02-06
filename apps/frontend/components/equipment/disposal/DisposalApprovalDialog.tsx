'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';
import { approveDisposal } from '@/lib/api/disposal-api';
import { DISPOSAL_REASON_LABELS, type DisposalRequest } from '@equipment-management/schemas';
import { formatDateTime } from '@/lib/utils/date';
import { DisposalProgressStepper } from './DisposalProgressStepper';
import { ReviewOpinionCard } from './ReviewOpinionCard';
import type { Equipment } from '@/lib/api/equipment-api';
import { EquipmentCacheInvalidation } from '@/lib/api/cache-invalidation';

interface DisposalApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string;
  equipment: Equipment;
  disposalRequest: DisposalRequest;
}

export function DisposalApprovalDialog({
  open,
  onOpenChange,
  equipmentId,
  equipment,
  disposalRequest,
}: DisposalApprovalDialogProps) {
  const [comment, setComment] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (decision: 'approve' | 'reject') =>
      approveDisposal(equipmentId, {
        decision,
        comment: comment || undefined,
      }),
    onSuccess: async (_, decision) => {
      toast({
        title: decision === 'approve' ? '최종 승인 완료' : '요청 반려',
        description:
          decision === 'approve'
            ? '장비 폐기가 최종 승인되었습니다.'
            : '폐기 요청이 반려되었습니다.',
      });
      // ✅ 중앙화된 캐시 무효화 헬퍼 사용
      await EquipmentCacheInvalidation.invalidateAfterDisposal(queryClient, equipmentId);
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: '처리 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    setComment('');
    setShowRejectInput(false);
    setShowConfirmation(false);
    onOpenChange(false);
  };

  const handleApprove = () => {
    setShowConfirmation(true);
  };

  const confirmApproval = () => {
    setShowConfirmation(false);
    mutation.mutate('approve');
  };

  const handleReject = () => {
    if (!showRejectInput) {
      setShowRejectInput(true);
    } else if (comment.length >= 10) {
      mutation.mutate('reject');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <DialogHeader>
            <DialogTitle>폐기 최종 승인</DialogTitle>
            <DialogDescription>
              폐기 요청 및 검토 내용을 확인하고 최종 승인해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* currentStep=3: steps 1-2 complete, step 3 (승인) is current */}
            <DisposalProgressStepper currentStep={3} />

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-900">
                  장비 및 폐기 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">장비명:</span> {equipment.name}
                </div>
                <div>
                  <span className="font-medium text-gray-700">관리번호:</span>{' '}
                  {equipment.managementNumber}
                </div>
                <div>
                  <span className="font-medium text-gray-700">요청자:</span>{' '}
                  {disposalRequest.requestedByName} | {formatDateTime(disposalRequest.requestedAt)}
                </div>
                <div>
                  <span className="font-medium text-gray-700">폐기 사유:</span>{' '}
                  {DISPOSAL_REASON_LABELS[disposalRequest.reason]}
                </div>
                <div>
                  <span className="font-medium text-gray-700">상세 사유:</span>
                  <p className="mt-1 text-gray-600 whitespace-pre-wrap">
                    {disposalRequest.reasonDetail}
                  </p>
                </div>
              </CardContent>
            </Card>

            {disposalRequest.reviewedByName &&
              disposalRequest.reviewedAt &&
              disposalRequest.reviewOpinion && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">검토 의견</Label>
                  <ReviewOpinionCard
                    reviewerName={disposalRequest.reviewedByName}
                    reviewedAt={disposalRequest.reviewedAt}
                    opinion={disposalRequest.reviewOpinion}
                  />
                </div>
              )}

            <div className="space-y-2">
              <Label htmlFor="comment">승인 코멘트 (선택)</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  showRejectInput
                    ? '반려 사유를 10자 이상 상세히 입력해주세요 (필수)'
                    : '승인 코멘트를 입력해주세요 (선택사항)'
                }
                rows={3}
                className="resize-none"
                aria-describedby={showRejectInput ? 'comment-hint' : undefined}
              />
              {showRejectInput && (
                <p id="comment-hint" className="text-xs text-red-500">
                  {comment.length}/10자 이상 (현재: {comment.length}자)
                </p>
              )}
            </div>

            {showRejectInput && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-800">
                  요청을 반려하려면 구체적인 사유를 입력하고 다시 반려 버튼을 클릭해주세요.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
              취소
            </Button>
            <Button
              variant="outline"
              onClick={handleReject}
              disabled={mutation.isPending || (showRejectInput && comment.length < 10)}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              반려
            </Button>
            <Button
              onClick={handleApprove}
              disabled={mutation.isPending || showRejectInput}
              className="bg-green-600 hover:bg-green-700"
            >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              최종 승인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              최종 승인 확인
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>
                  <span className="font-medium text-gray-900">{equipment.name}</span> 장비의 폐기를
                  최종 승인하시겠습니까?
                </p>
                <p className="text-red-600 font-medium">⚠️ 이 작업은 되돌릴 수 없습니다.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmApproval}
              className="bg-green-600 hover:bg-green-700"
            >
              최종 승인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
