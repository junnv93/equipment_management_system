'use client';

import { useState, useEffect, useId } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';

interface ValidationApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 'technical': 기술책임자 승인, 'quality': 품질책임자 승인 */
  type: 'technical' | 'quality';
  isPending: boolean;
  onConfirm: (comment: string | undefined) => void;
}

export function ValidationApproveDialog({
  open,
  onOpenChange,
  type,
  isPending,
  onConfirm,
}: ValidationApproveDialogProps) {
  const t = useTranslations('software');
  const [comment, setComment] = useState('');

  const helpId = useId();
  const countId = useId();

  const nsKey = type === 'technical' ? 'approveDialog' : 'qualityApproveDialog';
  const remaining = VALIDATION_RULES.LONG_TEXT_MAX_LENGTH - comment.length;

  useEffect(() => {
    if (!open) setComment('');
  }, [open]);

  const handleConfirm = () => {
    onConfirm(comment.trim() || undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-describedby={helpId}>
        <DialogHeader>
          <DialogTitle>{t(`validation.${nsKey}.title`)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor={`${nsKey}-comment`}>{t(`validation.${nsKey}.commentLabel`)}</Label>
            <Textarea
              id={`${nsKey}-comment`}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t(`validation.${nsKey}.commentPlaceholder`)}
              maxLength={VALIDATION_RULES.LONG_TEXT_MAX_LENGTH}
              className="min-h-[100px]"
              aria-describedby={`${helpId} ${countId}`}
              autoFocus
            />
            <div className="flex items-start justify-between gap-2">
              <p id={helpId} className="text-xs text-muted-foreground">
                {t(`validation.${nsKey}.commentHelp`)}
              </p>
              <p
                id={countId}
                className="shrink-0 text-xs text-muted-foreground tabular-nums"
                aria-live="polite"
              >
                {comment.length}/{VALIDATION_RULES.LONG_TEXT_MAX_LENGTH}
                {remaining <= 50 && (
                  <span className="sr-only">
                    {t('validation.approveDialog.charsRemaining', { count: remaining })}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t(`validation.${nsKey}.cancel`)}
          </Button>
          <Button onClick={handleConfirm} disabled={isPending} loading={isPending}>
            {isPending ? t(`validation.${nsKey}.submitting`) : t(`validation.${nsKey}.confirm`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
