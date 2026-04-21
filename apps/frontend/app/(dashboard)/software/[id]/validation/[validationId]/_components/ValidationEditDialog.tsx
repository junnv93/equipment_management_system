'use client';

import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { softwareValidationApi } from '@/lib/api/software-api';
import type { UpdateSoftwareValidationDto, SoftwareValidation } from '@/lib/api/software-api';
import { queryKeys } from '@/lib/api/query-config';
import { useCasGuardedMutation } from '@/hooks/use-cas-guarded-mutation';
import { ValidationTypeValues } from '@equipment-management/schemas';
import { VendorEditFields } from './VendorEditFields';

interface ValidationEditDialogProps {
  validationId: string;
  softwareId: string;
  validation: SoftwareValidation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface EditForm {
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

  // ref로 최신 validation 캡처 — open 전환 시에만 폼 초기화.
  // [open, validation] 의존성으로 두면 background refetch 시 사용자 편집 내용이 초기화됨.
  // (MEDIUM staleTime 2분 + refetchOnWindowFocus: true 조합에서 실제 발생)
  const validationRef = useRef(validation);
  validationRef.current = validation;

  useEffect(() => {
    if (open) {
      const v = validationRef.current;
      setEditForm({
        vendorName: v.vendorName ?? '',
        vendorSummary: v.vendorSummary ?? '',
        receivedBy: v.receivedBy ?? '',
        receivedDate: v.receivedDate?.split('T')[0] ?? '',
        attachmentNote: v.attachmentNote ?? '',
        softwareVersion: v.softwareVersion ?? '',
        testDate: v.testDate?.split('T')[0] ?? '',
      });
    } else {
      setEditForm(null);
    }
  }, [open]);

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
      queryClient.invalidateQueries({
        queryKey: queryKeys.softwareValidations.lists(),
      });
    },
    onError: () => {
      toast({ title: t('toast.error'), variant: 'destructive' });
    },
  });

  const handleUpdate = () => {
    if (!editForm) return;
    const data: Omit<UpdateSoftwareValidationDto, 'version'> = {
      softwareVersion: editForm.softwareVersion,
      testDate: editForm.testDate,
      ...(isVendor && {
        vendorName: editForm.vendorName,
        vendorSummary: editForm.vendorSummary,
        receivedBy: editForm.receivedBy,
        receivedDate: editForm.receivedDate,
        attachmentNote: editForm.attachmentNote,
      }),
    };
    updateMutation.mutate(data);
  };

  const isVendor = validation.validationType === ValidationTypeValues.VENDOR;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('validation.editDialog.title')}</DialogTitle>
        </DialogHeader>
        {editForm && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-software-version">{t('validation.form.versionLabel')}</Label>
              <Input
                id="edit-software-version"
                value={editForm.softwareVersion}
                onChange={(e) => setEditForm({ ...editForm, softwareVersion: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-test-date">{t('validation.form.testDateLabel')}</Label>
              <Input
                id="edit-test-date"
                type="date"
                value={editForm.testDate}
                onChange={(e) => setEditForm({ ...editForm, testDate: e.target.value })}
              />
            </div>
            {isVendor && (
              <VendorEditFields editForm={editForm} setEditForm={(v) => setEditForm(v)} />
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
