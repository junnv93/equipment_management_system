'use client';

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
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';
import { cancelDisposalRequest } from '@/lib/api/disposal-api';
import { EquipmentCacheInvalidation } from '@/lib/api/cache-invalidation';

interface DisposalCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string;
  equipmentName: string;
}

/**
 * Disposal request cancellation confirmation dialog
 *
 * UL-QP-18: Only the original requester can cancel a pending disposal request.
 * Cancellation is only allowed for requests that have not been reviewed yet.
 */
export function DisposalCancelDialog({
  open,
  onOpenChange,
  equipmentId,
  equipmentName,
}: DisposalCancelDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => cancelDisposalRequest(equipmentId),
    onSuccess: async () => {
      toast({
        title: '취소 완료',
        description: '폐기 요청이 취소되었습니다. 장비 상태가 사용 가능으로 변경되었습니다.',
      });
      // Invalidate equipment cache to refresh UI
      await EquipmentCacheInvalidation.invalidateAfterDisposal(queryClient, equipmentId);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: '취소 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent role="dialog" aria-modal="true">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            폐기 요청 취소
          </DialogTitle>
          <DialogDescription>정말 폐기 요청을 취소하시겠습니까?</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">{equipmentName}</span>의 폐기 요청이 취소되고, 장비
            상태가 <span className="font-semibold text-green-600">사용 가능</span>으로 변경됩니다.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            닫기
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
