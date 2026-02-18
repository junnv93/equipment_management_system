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
import { type DisposalRequest } from '@equipment-management/schemas';
import { formatDateTime } from '@/lib/utils/date';
import { DisposalProgressStepper } from './DisposalProgressStepper';
import { ReviewOpinionCard } from './ReviewOpinionCard';
import type { Equipment } from '@/lib/api/equipment-api';
import { EquipmentCacheInvalidation } from '@/lib/api/cache-invalidation';
import {
  DISPOSAL_BUTTON_TOKENS,
  DISPOSAL_INFO_CARD_TOKENS,
  CONTENT_TOKENS,
} from '@/lib/design-tokens';
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
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations('disposal');
  const tReason = useTranslations('disposal.reason');

  const mutation = useMutation({
    mutationFn: (decision: 'approve' | 'reject') =>
      approveDisposal(equipmentId, {
        version: disposalRequest.version,
        decision,
        comment: comment || undefined,
      }),
    onSuccess: async (_, decision) => {
      toast({
        title:
          decision === 'approve'
            ? t('approvalDialog.toasts.approveTitle')
            : t('approvalDialog.toasts.rejectTitle'),
        description:
          decision === 'approve'
            ? t('approvalDialog.toasts.approveDesc')
            : t('approvalDialog.toasts.rejectDesc'),
      });
      // ✅ 중앙화된 캐시 무효화 헬퍼 사용
      await EquipmentCacheInvalidation.invalidateAfterDisposal(queryClient, equipmentId);
      handleClose();
    },
    onError: async (error: Error) => {
      const errorMessage = error.message;
      toast({
        title: t('common.error'),
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
                  <span className="font-medium text-gray-700">{t('common.equipmentName')}</span>{' '}
                  {equipment.name}
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    {t('approvalDialog.managementNumber')}
                  </span>{' '}
                  {equipment.managementNumber}
                </div>
                <div>
                  <span className="font-medium text-gray-700">{t('common.requester')}</span>{' '}
                  {disposalRequest.requestedByName} | {formatDateTime(disposalRequest.requestedAt)}
                </div>
                <div>
                  <span className="font-medium text-gray-700">{t('common.disposalReason')}</span>{' '}
                  {tReason(disposalRequest.reason)}
                </div>
                <div>
                  <span className="font-medium text-gray-700">{t('common.reasonDetail')}</span>
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
                placeholder={
                  showRejectInput
                    ? t('approvalDialog.rejectPlaceholder')
                    : t('approvalDialog.approvePlaceholder')
                }
                rows={3}
                className="resize-none"
                aria-describedby={showRejectInput ? 'comment-hint' : undefined}
              />
              {showRejectInput && (
                <p
                  id="comment-hint"
                  className={`${DISPOSAL_INFO_CARD_TOKENS.rejectCount} ${CONTENT_TOKENS.numeric.tabular}`}
                >
                  {t('common.charCount', { count: comment.length })}
                </p>
              )}
            </div>

            {showRejectInput && (
              <div className={DISPOSAL_INFO_CARD_TOKENS.rejectNotice}>
                <p className={DISPOSAL_INFO_CARD_TOKENS.rejectText}>{t('common.rejectNotice')}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="outline"
              onClick={handleReject}
              disabled={mutation.isPending || (showRejectInput && comment.length < 10)}
              className={DISPOSAL_BUTTON_TOKENS.reject}
            >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.reject')}
            </Button>
            <Button
              onClick={handleApprove}
              disabled={mutation.isPending || showRejectInput}
              className={DISPOSAL_BUTTON_TOKENS.approve}
            >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('approvalDialog.approve')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              {t('approvalDialog.confirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>{t('approvalDialog.confirmDescription', { name: equipment.name })}</p>
                <p className="text-red-600 font-medium">{t('approvalDialog.confirmWarning')}</p>
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
    </>
  );
}
