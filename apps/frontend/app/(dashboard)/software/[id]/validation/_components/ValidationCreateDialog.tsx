'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  VALIDATION_TYPE_VALUES,
  ValidationTypeValues,
  type AcquisitionOrProcessingItem,
  type ControlItem,
} from '@equipment-management/schemas';
import type { ValidationType } from '@equipment-management/schemas';
import { VendorValidationFields } from './VendorValidationFields';
import { SelfValidationFields } from './SelfValidationFields';

export interface CreateFormState {
  validationType: ValidationType | '';
  softwareVersion: string;
  testDate: string;
  vendorName: string;
  vendorSummary: string;
  receivedBy: string;
  receivedDate: string;
  attachmentNote: string;
  referenceDocuments: string;
  operatingUnitDescription: string;
  softwareComponents: string;
  hardwareComponents: string;
  performedBy: string;
  acquisitionFunctions: AcquisitionOrProcessingItem[];
  processingFunctions: AcquisitionOrProcessingItem[];
  controlFunctions: ControlItem[];
}

interface ValidationCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createForm: CreateFormState;
  setCreateForm: React.Dispatch<React.SetStateAction<CreateFormState>>;
  onSubmit: () => void;
  isPending: boolean;
}

export function ValidationCreateDialog({
  open,
  onOpenChange,
  createForm,
  setCreateForm,
  onSubmit,
  isPending,
}: ValidationCreateDialogProps) {
  const t = useTranslations('software');
  const set = (patch: Partial<CreateFormState>) => setCreateForm((prev) => ({ ...prev, ...patch }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={
          createForm.validationType === ValidationTypeValues.SELF
            ? 'max-w-3xl max-h-[85vh] overflow-y-auto'
            : 'max-w-md'
        }
      >
        <DialogHeader>
          <DialogTitle>{t('validation.form.createTitle')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('validation.form.typeLabel')}</Label>
            <Select
              value={createForm.validationType}
              onValueChange={(v) => set({ validationType: v as ValidationType })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('validation.form.typePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {VALIDATION_TYPE_VALUES.map((vt) => (
                  <SelectItem key={vt} value={vt}>
                    {t(`validationType.${vt}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('validation.form.versionLabel')}</Label>
            <Input
              value={createForm.softwareVersion}
              onChange={(e) => set({ softwareVersion: e.target.value })}
              placeholder={t('validation.form.versionPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('validation.form.testDateLabel')}</Label>
            <Input
              type="date"
              value={createForm.testDate}
              onChange={(e) => set({ testDate: e.target.value })}
            />
          </div>
          {createForm.validationType === ValidationTypeValues.VENDOR && (
            <VendorValidationFields form={createForm} set={set} />
          )}
          {createForm.validationType === ValidationTypeValues.SELF && (
            <SelfValidationFields form={createForm} set={set} />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('validation.form.cancel')}
          </Button>
          <Button onClick={onSubmit} disabled={!createForm.validationType || isPending}>
            {isPending ? t('validation.form.submitting') : t('validation.form.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
