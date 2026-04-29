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

interface ValidationRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onConfirm: (reason: string) => void;
}

export function ValidationRejectDialog({
  open,
  onOpenChange,
  isPending,
  onConfirm,
}: ValidationRejectDialogProps) {
  const t = useTranslations('software');
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  const descId = useId();
  const errorId = useId();

  const isInvalid = touched && reason.trim().length === 0;

  useEffect(() => {
    if (!open) {
      setReason('');
      setTouched(false);
    }
  }, [open]);

  const handleConfirm = () => {
    setTouched(true);
    if (!reason.trim()) return;
    onConfirm(reason.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('validation.rejectDialog.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reject-reason">
              {t('validation.rejectDialog.reasonLabel')}
              <span className="ml-1 text-destructive" aria-hidden="true">
                *
              </span>
            </Label>
            <Textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (touched && e.target.value.trim()) setTouched(false);
              }}
              onBlur={() => setTouched(true)}
              placeholder={t('validation.rejectDialog.reasonPlaceholder')}
              className="min-h-[100px]"
              aria-required="true"
              aria-invalid={isInvalid}
              aria-describedby={isInvalid ? errorId : descId}
              autoFocus
            />
            {isInvalid ? (
              <p
                id={errorId}
                className="text-sm text-destructive"
                role="alert"
                aria-live="assertive"
              >
                {t('validation.rejectDialog.reasonRequired')}
              </p>
            ) : (
              <p id={descId} className="text-xs text-muted-foreground">
                {t('validation.rejectDialog.reasonHint')}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t('validation.rejectDialog.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending || !reason.trim()}
            loading={isPending}
          >
            {isPending
              ? t('validation.rejectDialog.submitting')
              : t('validation.rejectDialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
