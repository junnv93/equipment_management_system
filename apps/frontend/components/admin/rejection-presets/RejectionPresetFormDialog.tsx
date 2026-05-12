'use client';

import { useState, useId } from 'react';
import { useTranslations } from 'next-intl';

import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useFormDialogClose } from '@/hooks/use-form-dialog-close';
import { type RejectionPreset } from '@/lib/api/checkout-api';
import {
  useCreateRejectionPresetMutation,
  useUpdateRejectionPresetMutation,
} from '@/hooks/use-rejection-preset-mutations';

interface RejectionPresetFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  preset?: RejectionPreset;
  onClose: () => void;
}

/**
 * 반려 사유 프리셋 추가/수정 dialog (S-4).
 *
 * - useFormDialogClose 적용 — destructive close 가드 SSOT.
 * - label maxLength=`EXTENDED_TEXT_MAX_LENGTH(200)` + char counter.
 * - template maxLength=`LONG_TEXT_MAX_LENGTH(500)` + char counter (optional 필드).
 * - sortOrder integer, 0..`SORT_ORDER_MAX(9999)`.
 * - useActionState 미사용 — TanStack Query mutation hook (CLAUDE.md SSOT).
 */
export function RejectionPresetFormDialog({
  open,
  mode,
  preset,
  onClose,
}: RejectionPresetFormDialogProps) {
  const t = useTranslations('admin.rejectionPresets');

  const [label, setLabel] = useState<string>(preset?.label ?? '');
  const [template, setTemplate] = useState<string>(preset?.template ?? '');
  const [sortOrder, setSortOrder] = useState<string>(String(preset?.sortOrder ?? 0));

  const labelId = useId();
  const templateId = useId();
  const sortOrderId = useId();
  const labelCounterId = useId();
  const templateCounterId = useId();

  const createMutation = useCreateRejectionPresetMutation();
  const updateMutation = useUpdateRejectionPresetMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const isDirty = () => {
    if (mode === 'create') {
      return label.trim() !== '' || template.trim() !== '' || sortOrder !== '0';
    }
    return (
      label !== (preset?.label ?? '') ||
      template !== (preset?.template ?? '') ||
      sortOrder !== String(preset?.sortOrder ?? 0)
    );
  };

  const close = useFormDialogClose({
    isDirty,
    onConfirmClose: onClose,
  });

  const trimmedLabel = label.trim();
  const labelLen = label.length;
  const templateLen = template.length;
  const parsedSortOrder = Number.parseInt(sortOrder, 10);
  const isSortOrderValid =
    Number.isFinite(parsedSortOrder) &&
    parsedSortOrder >= 0 &&
    parsedSortOrder <= VALIDATION_RULES.SORT_ORDER_MAX;
  const isLabelValid =
    trimmedLabel.length > 0 && labelLen <= VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH;
  const isTemplateValid = templateLen <= VALIDATION_RULES.LONG_TEXT_MAX_LENGTH;
  const canSubmit = isLabelValid && isTemplateValid && isSortOrderValid && !isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const trimmedTemplate = template.trim();
    if (mode === 'create') {
      createMutation.mutate(
        {
          label: trimmedLabel,
          template: trimmedTemplate === '' ? undefined : trimmedTemplate,
          sortOrder: parsedSortOrder,
        },
        { onSuccess: () => onClose() }
      );
    } else if (preset) {
      updateMutation.mutate(
        {
          id: preset.id,
          label: trimmedLabel,
          template: trimmedTemplate === '' ? null : trimmedTemplate,
          sortOrder: parsedSortOrder,
        },
        { onSuccess: () => onClose() }
      );
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) close.requestClose();
        }}
      >
        <DialogContent
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            close.requestClose();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? t('form.titleCreate') : t('form.titleEdit')}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create' ? t('form.descriptionCreate') : t('form.descriptionEdit')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor={labelId}>{t('form.labelField')}</Label>
              <Input
                id={labelId}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH}
                aria-invalid={!isLabelValid}
                aria-describedby={labelCounterId}
                disabled={isPending}
              />
              <p
                id={labelCounterId}
                className="text-2xs font-mono text-muted-foreground text-right"
                aria-live="polite"
              >
                {labelLen} / {VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={templateId}>{t('form.templateField')}</Label>
              <Textarea
                id={templateId}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                maxLength={VALIDATION_RULES.LONG_TEXT_MAX_LENGTH}
                rows={4}
                aria-invalid={!isTemplateValid}
                aria-describedby={templateCounterId}
                disabled={isPending}
                placeholder={t('form.templatePlaceholder')}
              />
              <p
                id={templateCounterId}
                className="text-2xs font-mono text-muted-foreground text-right"
                aria-live="polite"
              >
                {templateLen} / {VALIDATION_RULES.LONG_TEXT_MAX_LENGTH}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={sortOrderId}>{t('form.sortOrderField')}</Label>
              <Input
                id={sortOrderId}
                type="number"
                inputMode="numeric"
                min={0}
                max={VALIDATION_RULES.SORT_ORDER_MAX}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                aria-invalid={!isSortOrderValid}
                disabled={isPending}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={close.requestClose} disabled={isPending}>
              {t('form.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {t('form.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={close.confirmOpen} onOpenChange={(o) => !o && close.cancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('form.discardTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('form.discardDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('form.discardCancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={close.confirm}>
              {t('form.discardConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
