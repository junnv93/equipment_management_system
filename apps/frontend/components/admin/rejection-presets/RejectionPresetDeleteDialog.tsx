'use client';

import { useTranslations } from 'next-intl';

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
import { type RejectionPreset } from '@/lib/api/checkout-api';
import { useDeleteRejectionPresetMutation } from '@/hooks/use-rejection-preset-mutations';

interface RejectionPresetDeleteDialogProps {
  open: boolean;
  preset: RejectionPreset;
  onClose: () => void;
}

/**
 * 반려 사유 프리셋 삭제 확인 dialog (S-4).
 *
 * - shadcn AlertDialog (`role="alertdialog"` 자동) — focus trap.
 * - isDefault=true row는 RejectionPresetRow에서 진입 차단 — 본 dialog는 진입 시점에 안전.
 * - mutation onSuccess → onClose() 자동.
 */
export function RejectionPresetDeleteDialog({
  open,
  preset,
  onClose,
}: RejectionPresetDeleteDialogProps) {
  const t = useTranslations('admin.rejectionPresets');
  const deleteMutation = useDeleteRejectionPresetMutation();

  const handleConfirm = () => {
    deleteMutation.mutate({ id: preset.id }, { onSuccess: () => onClose() });
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && !deleteMutation.isPending && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('delete.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('delete.description', { label: preset.label })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            {t('delete.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t('delete.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
