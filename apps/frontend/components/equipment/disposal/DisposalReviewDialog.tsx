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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download } from 'lucide-react';
import { reviewDisposal } from '@/lib/api/disposal-api';
import { DISPOSAL_REASON_LABELS, type DisposalRequest } from '@equipment-management/schemas';
import { formatDateTime } from '@/lib/utils/date';
import { EquipmentHistorySummary } from './EquipmentHistorySummary';
import type { Equipment } from '@/lib/api/equipment-api';
import { EquipmentCacheInvalidation } from '@/lib/api/cache-invalidation';

interface DisposalReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string;
  equipment: Equipment;
  disposalRequest: DisposalRequest;
}

export function DisposalReviewDialog({
  open,
  onOpenChange,
  equipmentId,
  equipment,
  disposalRequest,
}: DisposalReviewDialogProps) {
  const [opinion, setOpinion] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (decision: 'approve' | 'reject') =>
      reviewDisposal(equipmentId, { version: disposalRequest.version, decision, opinion }),
    onSuccess: async (_, decision) => {
      toast({
        title: decision === 'approve' ? '검토 완료' : '요청 반려',
        description:
          decision === 'approve'
            ? '폐기 검토가 완료되었습니다. 시험소장의 최종 승인을 기다립니다.'
            : '폐기 요청이 반려되었습니다.',
      });
      // ✅ 중앙화된 캐시 무효화 헬퍼 사용
      await EquipmentCacheInvalidation.invalidateAfterDisposal(queryClient, equipmentId);
      handleClose();
    },
    onError: async (error: Error) => {
      const errorMessage = error.message;
      toast({
        title: '처리 실패',
        description: errorMessage,
        variant: 'destructive',
      });
      // ✅ 409 Conflict 시 자동 새로고침
      if (errorMessage.includes('다른 사용자가') || errorMessage.includes('VERSION_CONFLICT')) {
        await EquipmentCacheInvalidation.invalidateAfterDisposal(queryClient, equipmentId);
      }
    },
  });

  const handleClose = () => {
    setOpinion('');
    setShowRejectInput(false);
    onOpenChange(false);
  };

  const handleReject = () => {
    if (!showRejectInput) {
      setShowRejectInput(true);
    } else if (opinion.length >= 10) {
      mutation.mutate('reject');
    }
  };

  const isValid = opinion.length >= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <DialogHeader>
          <DialogTitle>폐기 검토</DialogTitle>
          <DialogDescription>폐기 요청 내용을 검토하고 의견을 작성해주세요.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-900">폐기 요청 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">장비명:</span> {equipment.name}
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
              {disposalRequest.attachments && disposalRequest.attachments.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">첨부 파일:</span>
                  <div className="mt-1 space-y-1">
                    {disposalRequest.attachments.map((file) => (
                      <a
                        key={file.id}
                        href={file.url}
                        download={file.filename}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                        aria-label={`다운로드: ${file.filename}`}
                      >
                        <Download className="h-4 w-4" />
                        {file.filename}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <EquipmentHistorySummary equipment={equipment} />

          <div className="space-y-2">
            <Label htmlFor="opinion">
              검토 의견 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="opinion"
              value={opinion}
              onChange={(e) => setOpinion(e.target.value)}
              placeholder={
                showRejectInput
                  ? '반려 사유를 10자 이상 상세히 입력해주세요'
                  : '검토 의견을 10자 이상 입력해주세요'
              }
              rows={4}
              className="resize-none"
              aria-describedby="opinion-hint"
            />
            <p id="opinion-hint" className="text-xs text-gray-500">
              {opinion.length}/10자 이상 (현재: {opinion.length}자)
            </p>
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
            disabled={mutation.isPending || (showRejectInput && !isValid)}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            반려
          </Button>
          <Button
            onClick={() => mutation.mutate('approve')}
            disabled={!isValid || mutation.isPending || showRejectInput}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            검토 완료
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
