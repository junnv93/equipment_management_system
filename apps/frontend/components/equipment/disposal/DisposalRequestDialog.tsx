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
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Upload, X } from 'lucide-react';
import { DisposalReasonSelector } from './DisposalReasonSelector';
import { requestDisposal } from '@/lib/api/disposal-api';
import type { DisposalReason } from '@equipment-management/schemas';
import { EquipmentCacheInvalidation } from '@/lib/api/cache-invalidation';
import { DISPOSAL_BUTTON_TOKENS, CONTENT_TOKENS } from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';
import { DOCUMENT_FILE_RULES, FILE_UPLOAD_LIMITS } from '@equipment-management/shared-constants';
import { validateFile } from '@/lib/utils/file-validation';

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
  const t = useTranslations('disposal');

  const mutation = useMutation({
    mutationFn: () =>
      requestDisposal(equipmentId, {
        reason: reason as DisposalReason,
        reasonDetail,
        attachments: attachments.length > 0 ? attachments : undefined,
      }),
    onSuccess: async () => {
      toast({
        title: t('requestDialog.toasts.successTitle'),
        description: t('requestDialog.toasts.successDesc'),
      });
      // ✅ 중앙화된 캐시 무효화 헬퍼 사용
      await EquipmentCacheInvalidation.invalidateAfterDisposal(queryClient, equipmentId);
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: t('requestDialog.toasts.errorTitle'),
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
    if (!files) return;

    const validFiles: File[] = [];
    const errors: string[] = [];
    const acceptStr = DOCUMENT_FILE_RULES.other.accept;

    Array.from(files).forEach((file) => {
      if (validFiles.length >= FILE_UPLOAD_LIMITS.MAX_FILE_COUNT) return;
      const error = validateFile(file, { accept: acceptStr });
      if (error) {
        errors.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      toast({
        title: t('requestDialog.toasts.fileValidationError'),
        description: errors.join(', '),
        variant: 'destructive',
      });
    }

    setAttachments(validFiles);
    if (validFiles.length === 0) {
      e.target.value = '';
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
          <DialogTitle>{t('requestDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('requestDialog.description', { name: equipmentName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <DisposalReasonSelector value={reason} onValueChange={(value) => setReason(value)} />

          <div className="space-y-2">
            <Label htmlFor="reasonDetail">
              {t('requestDialog.reasonDetailLabel')} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reasonDetail"
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              placeholder={t('requestDialog.reasonDetailPlaceholder')}
              rows={4}
              className="resize-none"
              aria-describedby="reasonDetail-hint"
            />
            <p
              id="reasonDetail-hint"
              className={`text-xs text-muted-foreground ${CONTENT_TOKENS.numeric.tabular}`}
            >
              {t('common.charCount', { count: reasonDetail.length })}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachments">{t('requestDialog.attachmentsLabel')}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="attachments"
                type="file"
                multiple
                accept={DOCUMENT_FILE_RULES.other.accept}
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
                aria-label={t('requestDialog.selectFileAriaLabel')}
              >
                <Upload className="mr-2 h-4 w-4" />
                {t('requestDialog.selectFile')}
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
                      aria-label={t('requestDialog.removeFileAriaLabel', { name: file.name })}
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
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!isValid || mutation.isPending}
            className={DISPOSAL_BUTTON_TOKENS.submit}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" />}
            {t('requestDialog.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
