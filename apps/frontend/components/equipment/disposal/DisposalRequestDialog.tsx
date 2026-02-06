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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X } from 'lucide-react';
import { DisposalReasonSelector } from './DisposalReasonSelector';
import { requestDisposal } from '@/lib/api/disposal-api';
import type { DisposalReason } from '@equipment-management/schemas';
import { EquipmentCacheInvalidation } from '@/lib/api/cache-invalidation';

interface DisposalRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string;
  equipmentName: string;
}

export function DisposalRequestDialog({
  open,
  onOpenChange,
  equipmentId,
  equipmentName,
}: DisposalRequestDialogProps) {
  const [reason, setReason] = useState<DisposalReason | ''>('');
  const [reasonDetail, setReasonDetail] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      requestDisposal(equipmentId, {
        reason: reason as DisposalReason,
        reasonDetail,
        attachments: attachments.length > 0 ? attachments : undefined,
      }),
    onSuccess: async () => {
      toast({
        title: '폐기 요청 완료',
        description: '폐기 요청이 성공적으로 등록되었습니다.',
      });
      // ✅ 중앙화된 캐시 무효화 헬퍼 사용
      await EquipmentCacheInvalidation.invalidateAfterDisposal(queryClient, equipmentId);
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: '폐기 요청 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    setReason('');
    setReasonDetail('');
    setAttachments([]);
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setAttachments(Array.from(files));
    }
  };

  const removeFile = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const isValid = reason !== '' && reasonDetail.length >= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" role="dialog" aria-modal="true">
        <DialogHeader>
          <DialogTitle>장비 폐기 요청</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-gray-900">{equipmentName}</span> 장비의 폐기를
            요청합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <DisposalReasonSelector value={reason} onValueChange={(value) => setReason(value)} />

          <div className="space-y-2">
            <Label htmlFor="reasonDetail">
              상세 사유 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reasonDetail"
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              placeholder="폐기 사유를 10자 이상 상세히 입력해주세요"
              rows={4}
              className="resize-none"
              aria-describedby="reasonDetail-hint"
            />
            <p id="reasonDetail-hint" className="text-xs text-gray-500">
              {reasonDetail.length}/10자 이상 (현재: {reasonDetail.length}자)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachments">첨부 파일 (선택)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="attachments"
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                aria-hidden="false"
                tabIndex={-1}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('attachments')?.click()}
                className="w-full"
                aria-label="파일 선택"
              >
                <Upload className="mr-2 h-4 w-4" />
                파일 선택
              </Button>
            </div>
            {attachments.length > 0 && (
              <div className="space-y-1">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded border p-2 text-sm"
                  >
                    <span className="truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-6 w-6 p-0"
                      aria-label={`파일 제거: ${file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
            취소
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!isValid || mutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            폐기 요청
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
