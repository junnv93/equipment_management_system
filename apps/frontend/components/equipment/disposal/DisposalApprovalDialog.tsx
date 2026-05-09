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
import { useToast } from '@/components/ui/use-toast';
import { AlertTriangle } from 'lucide-react';
import { approveDisposal } from '@/lib/api/disposal-api';
import { type DisposalRequest } from '@equipment-management/schemas';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { DisposalProgressStepper } from './DisposalProgressStepper';
import { ReviewOpinionCard } from './ReviewOpinionCard';
import RejectModal from '@/components/approvals/RejectModal';
import type { Equipment } from '@/lib/api/equipment-api';
import { EquipmentCacheInvalidation } from '@/lib/api/cache-invalidation';
import { isConflictError } from '@/lib/errors/equipment-errors';
import { mapDisposalErrorToToast } from '@/lib/errors/disposal-errors';
import { DISPOSAL_BUTTON_TOKENS, DISPOSAL_INFO_CARD_TOKENS } from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';

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
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations('disposal');
  const tErrors = useTranslations('errors');
  const { fmtDateTime } = useDateFormatter();
  const tReason = useTranslations('disposal.reason');

  const mutation = useMutation({
    mutationFn: (args: { decision: 'approve' | 'reject'; comment?: string }) =>
      approveDisposal(equipmentId, {
        version: disposalRequest.version,
        decision: args.decision,
        comment: args.comment,
      }),
    onSuccess: async (_, args) => {
      toast({
        title:
          args.decision === 'approve'
            ? t('approvalDialog.toasts.approveTitle')
            : t('approvalDialog.toasts.rejectTitle'),
        description:
          args.decision === 'approve'
            ? t('approvalDialog.toasts.approveDesc')
            : t('approvalDialog.toasts.rejectDesc'),
      });
      await EquipmentCacheInvalidation.invalidateAfterDisposal(queryClient, equipmentId);
      handleClose();
    },
    onError: async (error: Error) => {
      toast({
        ...mapDisposalErrorToToast(error, t, tErrors),
        variant: 'destructive',
      });
      if (isConflictError(error)) {
        await EquipmentCacheInvalidation.invalidateAfterDisposal(queryClient, equipmentId);
      }
    },
  });

  const handleClose = () => {
    setComment('');
    setRejectModalOpen(false);
    setShowConfirmation(false);
    onOpenChange(false);
  };

  const handleApprove = () => {
    setShowConfirmation(true);
  };

  const confirmApproval = () => {
    setShowConfirmation(false);
    mutation.mutate({ decision: 'approve', comment: comment || undefined });
  };

  const handleRejectConfirm = async (reason: string): Promise<void> => {
    try {
      await mutation.mutateAsync({ decision: 'reject', comment: reason });
      setRejectModalOpen(false);
    } catch {
      // onError handles the error toast; RejectModal stays open for retry
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
            <DialogTitle>{t('approvalDialog.title')}</DialogTitle>
            <DialogDescription>{t('approvalDialog.description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* currentStep=3: steps 1-2 complete, step 3 (승인) is current */}
            <DisposalProgressStepper currentStep={3} />

            <Card className={DISPOSAL_INFO_CARD_TOKENS.container}>
              <CardHeader className="pb-3">
                <CardTitle className={DISPOSAL_INFO_CARD_TOKENS.title}>
                  {t('approvalDialog.infoTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-foreground">{t('common.equipmentName')}</span>{' '}
                  {equipment.name}
                </div>
                <div>
                  <span className="font-medium text-foreground">
                    {t('approvalDialog.managementNumber')}
                  </span>{' '}
                  {equipment.managementNumber}
                </div>
                <div>
                  <span className="font-medium text-foreground">{t('common.requester')}</span>{' '}
                  {disposalRequest.requestedByName} | {fmtDateTime(disposalRequest.requestedAt)}
                </div>
                <div>
                  <span className="font-medium text-foreground">{t('common.disposalReason')}</span>{' '}
                  {tReason(disposalRequest.reason)}
                </div>
                <div>
                  <span className="font-medium text-foreground">{t('common.reasonDetail')}</span>
                  <p className="mt-1 text-muted-foreground whitespace-pre-wrap">
                    {disposalRequest.reasonDetail}
                  </p>
                </div>
              </CardContent>
            </Card>

            {disposalRequest.reviewedByName &&
              disposalRequest.reviewedAt &&
              disposalRequest.reviewOpinion && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('approvalDialog.reviewOpinion')}</Label>
                  <ReviewOpinionCard
                    reviewerName={disposalRequest.reviewedByName}
                    reviewedAt={disposalRequest.reviewedAt}
                    opinion={disposalRequest.reviewOpinion}
                  />
                </div>
              )}

            <div className="space-y-2">
              <Label htmlFor="comment">{t('approvalDialog.commentLabel')}</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('approvalDialog.approvePlaceholder')}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={mutation.isPending}
              loading={mutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setRejectModalOpen(true)}
              disabled={mutation.isPending}
              loading={mutation.isPending}
              className={DISPOSAL_BUTTON_TOKENS.reject}
            >
              {t('common.reject')}
            </Button>
            <Button
              onClick={handleApprove}
              disabled={mutation.isPending}
              loading={mutation.isPending}
              className={DISPOSAL_BUTTON_TOKENS.approve}
            >
              {t('approvalDialog.approve')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-brand-warning" />
              {t('approvalDialog.confirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>{t('approvalDialog.confirmDescription', { name: equipment.name })}</p>
                <p className="text-brand-critical font-medium">
                  {t('approvalDialog.confirmWarning')}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApproval} className={DISPOSAL_BUTTON_TOKENS.approve}>
              {t('approvalDialog.approve')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RejectModal
        mode="domain"
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleRejectConfirm}
        title={t('approvalDialog.toasts.rejectTitle')}
        description={t('approvalDialog.rejectModalDescription')}
      />
    </>
  );
}
