'use client';

import { useTranslations } from 'next-intl';
import { AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export interface EquipmentApprovalConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEdit: boolean;
  isLoading: boolean;
  onConfirm: () => void;
}

export function EquipmentApprovalConfirmDialog({
  open,
  onOpenChange,
  isEdit,
  isLoading,
  onConfirm,
}: EquipmentApprovalConfirmDialogProps) {
  const t = useTranslations('equipment');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-brand-warning" />
            {isEdit ? t('form.confirmDialog.editTitle') : t('form.confirmDialog.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t('form.confirmDialog.editDescription')
              : t('form.confirmDialog.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>{t('form.confirmDialog.approvalProcessTitle')}</AlertTitle>
            <AlertDescription className="mt-2">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>{t('form.confirmDialog.approvalProcessStep1')}</li>
                <li>{t('form.confirmDialog.approvalProcessStep2')}</li>
                <li>{t('form.confirmDialog.approvalProcessStep3')}</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('form.confirmDialog.cancel')}
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? t('form.confirmDialog.saving') : t('form.confirmDialog.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
