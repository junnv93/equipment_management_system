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
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('disposal');

  const mutation = useMutation({
    mutationFn: () => cancelDisposalRequest(equipmentId),
    onSuccess: async () => {
      toast({
        title: t('cancelDialog.toasts.successTitle'),
        description: t('cancelDialog.toasts.successDesc'),
      });
      // Invalidate equipment cache to refresh UI
      await EquipmentCacheInvalidation.invalidateAfterDisposal(queryClient, equipmentId);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: t('cancelDialog.toasts.errorTitle'),
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
            {t('cancelDialog.title')}
          </DialogTitle>
          <DialogDescription>{t('cancelDialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600">
            {t.rich('cancelDialog.message', {
              name: equipmentName,
              status: t('cancelDialog.available'),
            })}
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            {t('cancelDialog.close')}
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('cancelDialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
