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

export interface InspectionConfirmDialogsProps {
  closeConfirmOpen: boolean;
  onCloseCancel: () => void;
  onCloseConfirm: () => void;
  pendingToggleOffConfirm: boolean;
  onCancelToggleOff: () => void;
  onConfirmToggleOff: () => void;
  itemCount: number;
  sectionCount: number;
}

export function InspectionConfirmDialogs({
  closeConfirmOpen,
  onCloseCancel,
  onCloseConfirm,
  pendingToggleOffConfirm,
  onCancelToggleOff,
  onConfirmToggleOff,
  itemCount,
  sectionCount,
}: InspectionConfirmDialogsProps) {
  const t = useTranslations('calibration');

  return (
    <>
      <AlertDialog
        open={closeConfirmOpen}
        onOpenChange={(o) => {
          if (!o) onCloseCancel();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('intermediateInspection.cancelConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('intermediateInspection.cancelConfirm.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCloseCancel}>
              {t('intermediateInspection.cancelConfirm.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onCloseConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('intermediateInspection.cancelConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={pendingToggleOffConfirm}
        onOpenChange={(open) => {
          if (!open) onCancelToggleOff();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('intermediateInspection.prefill.toggleOff.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('intermediateInspection.prefill.toggleOff.description', {
                itemCount,
                sectionCount,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancelToggleOff}>
              {t('intermediateInspection.prefill.toggleOff.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmToggleOff}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('intermediateInspection.prefill.toggleOff.action')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
