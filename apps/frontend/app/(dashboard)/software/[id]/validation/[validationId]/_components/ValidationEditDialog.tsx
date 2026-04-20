'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { UserCombobox } from '@/components/ui/user-combobox';
import { softwareValidationApi } from '@/lib/api/software-api';
import type { UpdateSoftwareValidationDto, SoftwareValidation } from '@/lib/api/software-api';
import { queryKeys } from '@/lib/api/query-config';
import { useCasGuardedMutation } from '@/hooks/use-cas-guarded-mutation';

interface ValidationEditDialogProps {
  validationId: string;
  softwareId: string;
  validation: SoftwareValidation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EditForm {
  vendorName: string;
  vendorSummary: string;
  receivedBy: string;
  receivedDate: string;
  attachmentNote: string;
  softwareVersion: string;
  testDate: string;
}

export function ValidationEditDialog({
  validationId,
  softwareId,
  validation,
  open,
  onOpenChange,
}: ValidationEditDialogProps) {
  const t = useTranslations('software');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editForm, setEditForm] = useState<EditForm | null>(null);

  useEffect(() => {
    if (open) {
      setEditForm({
        vendorName: validation.vendorName ?? '',
        vendorSummary: validation.vendorSummary ?? '',
        receivedBy: validation.receivedBy ?? '',
        receivedDate: validation.receivedDate?.split('T')[0] ?? '',
        attachmentNote: validation.attachmentNote ?? '',
        softwareVersion: validation.softwareVersion ?? '',
        testDate: validation.testDate?.split('T')[0] ?? '',
      });
    } else {
      setEditForm(null);
    }
  }, [open, validation]);

  const updateMutation = useCasGuardedMutation<
    Awaited<ReturnType<typeof softwareValidationApi.update>>,
    Omit<UpdateSoftwareValidationDto, 'version'>
  >({
    fetchCasVersion: () => softwareValidationApi.get(validationId).then((v) => v.version),
    mutationFn: (data, version) => softwareValidationApi.update(validationId, { ...data, version }),
    onSuccess: () => {
      toast({ title: t('toast.updateSuccess') });
      onOpenChange(false);
      queryClient.invalidateQueries({
        queryKey: queryKeys.softwareValidations.detail(validationId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.softwareValidations.byTestSoftware(softwareId),
      });
    },
    onError: () => {
      toast({ title: t('toast.error'), variant: 'destructive' });
    },
  });

  const handleUpdate = () => {
    if (!editForm) return;
    const data: Omit<UpdateSoftwareValidationDto, 'version'> = {
      ...(editForm.softwareVersion ? { softwareVersion: editForm.softwareVersion } : {}),
      ...(editForm.testDate ? { testDate: editForm.testDate } : {}),
      ...(editForm.vendorName ? { vendorName: editForm.vendorName } : {}),
      ...(editForm.vendorSummary ? { vendorSummary: editForm.vendorSummary } : {}),
      ...(editForm.receivedBy ? { receivedBy: editForm.receivedBy } : {}),
      ...(editForm.receivedDate ? { receivedDate: editForm.receivedDate } : {}),
      ...(editForm.attachmentNote ? { attachmentNote: editForm.attachmentNote } : {}),
    };
    updateMutation.mutate(data);
  };

  const isVendor = validation.validationType === 'vendor';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('validation.editDialog.title')}</DialogTitle>
        </DialogHeader>
        {editForm && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('validation.form.versionLabel')}</Label>
              <Input
                value={editForm.softwareVersion}
                onChange={(e) => setEditForm({ ...editForm, softwareVersion: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('validation.form.testDateLabel')}</Label>
              <Input
                type="date"
                value={editForm.testDate}
                onChange={(e) => setEditForm({ ...editForm, testDate: e.target.value })}
              />
            </div>
            {isVendor && (
              <>
                <div className="space-y-2">
                  <Label>{t('validation.form.vendorNameLabel')}</Label>
                  <Input
                    value={editForm.vendorName}
                    onChange={(e) => setEditForm({ ...editForm, vendorName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('validation.form.vendorSummaryLabel')}</Label>
                  <Textarea
                    value={editForm.vendorSummary}
                    onChange={(e) => setEditForm({ ...editForm, vendorSummary: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('validation.form.receivedByLabel')}</Label>
                    <UserCombobox
                      value={editForm.receivedBy || undefined}
                      onChange={(id) => setEditForm({ ...editForm, receivedBy: id ?? '' })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('validation.form.receivedDateLabel')}</Label>
                    <Input
                      type="date"
                      value={editForm.receivedDate}
                      onChange={(e) => setEditForm({ ...editForm, receivedDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('validation.form.attachmentNoteLabel')}</Label>
                  <Textarea
                    value={editForm.attachmentNote}
                    onChange={(e) => setEditForm({ ...editForm, attachmentNote: e.target.value })}
                    placeholder={t('validation.form.attachmentNotePlaceholder')}
                  />
                </div>
              </>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('validation.form.cancel')}
              </Button>
              <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                {updateMutation.isPending
                  ? t('validation.editDialog.saving')
                  : t('validation.editDialog.save')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
