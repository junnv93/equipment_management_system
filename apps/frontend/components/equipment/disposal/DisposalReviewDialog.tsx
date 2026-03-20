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
import { type DisposalRequest } from '@equipment-management/schemas';
import { formatDateTime } from '@/lib/utils/date';
import { EquipmentHistorySummary } from './EquipmentHistorySummary';
import type { Equipment } from '@/lib/api/equipment-api';
import { EquipmentCacheInvalidation } from '@/lib/api/cache-invalidation';
import { isConflictError } from '@/lib/errors/equipment-errors';
import {
  DISPOSAL_BUTTON_TOKENS,
  DISPOSAL_INFO_CARD_TOKENS,
  DISPOSAL_FILE_LINK_TOKENS,
  CONTENT_TOKENS,
} from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('disposal');
  const tReason = useTranslations('disposal.reason');

  const mutation = useMutation({
    mutationFn: (decision: 'approve' | 'reject') =>
      reviewDisposal(equipmentId, { version: disposalRequest.version, decision, opinion }),
    onSuccess: async (_, decision) => {
      toast({
        title:
          decision === 'approve'
            ? t('reviewDialog.toasts.approveTitle')
            : t('reviewDialog.toasts.rejectTitle'),
        description:
          decision === 'approve'
            ? t('reviewDialog.toasts.approveDesc')
            : t('reviewDialog.toasts.rejectDesc'),
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
      if (isConflictError(error)) {
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
          <DialogTitle>{t('reviewDialog.title')}</DialogTitle>
          <DialogDescription>{t('reviewDialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card className={DISPOSAL_INFO_CARD_TOKENS.container}>
            <CardHeader className="pb-3">
              <CardTitle className={DISPOSAL_INFO_CARD_TOKENS.title}>
                {t('reviewDialog.infoTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-foreground">{t('common.equipmentName')}</span>{' '}
                {equipment.name}
              </div>
              <div>
                <span className="font-medium text-foreground">{t('common.requester')}</span>{' '}
                {disposalRequest.requestedByName} | {formatDateTime(disposalRequest.requestedAt)}
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
              {disposalRequest.attachments && disposalRequest.attachments.length > 0 && (
                <div>
                  <span className="font-medium text-foreground">{t('common.attachments')}</span>
                  <div className="mt-1 space-y-1">
                    {disposalRequest.attachments.map((file) => (
                      <a
                        key={file.id}
                        href={file.url}
                        download={file.filename}
                        className={DISPOSAL_FILE_LINK_TOKENS.base}
                        aria-label={t('common.downloadAriaLabel', { name: file.filename })}
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
              {t('reviewDialog.opinionLabel')} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="opinion"
              value={opinion}
              onChange={(e) => setOpinion(e.target.value)}
              placeholder={
                showRejectInput
                  ? t('reviewDialog.rejectPlaceholder')
                  : t('reviewDialog.opinionPlaceholder')
              }
              rows={4}
              className="resize-none"
              aria-describedby="opinion-hint"
            />
            <p
              id="opinion-hint"
              className={`text-xs text-muted-foreground ${CONTENT_TOKENS.numeric.tabular}`}
            >
              {t('common.charCount', { count: opinion.length })}
            </p>
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
            disabled={mutation.isPending || (showRejectInput && !isValid)}
            className={DISPOSAL_BUTTON_TOKENS.reject}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" />}
            {t('common.reject')}
          </Button>
          <Button
            onClick={() => mutation.mutate('approve')}
            disabled={!isValid || mutation.isPending || showRejectInput}
            className={DISPOSAL_BUTTON_TOKENS.review}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" />}
            {t('reviewDialog.reviewComplete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
