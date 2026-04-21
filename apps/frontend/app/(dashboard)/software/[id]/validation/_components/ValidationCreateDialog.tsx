'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { UserCombobox } from '@/components/ui/user-combobox';
import { VALIDATION_TYPE_VALUES, ValidationTypeValues } from '@equipment-management/schemas';
import type { ValidationType } from '@equipment-management/schemas';
import { ValidationFunctionsTable } from './ValidationFunctionsTable';
import { ValidationControlTable } from './ValidationControlTable';

export interface FunctionItem {
  [key: string]: string;
}

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
  acquisitionFunctions: FunctionItem[];
  processingFunctions: FunctionItem[];
  controlFunctions: FunctionItem[];
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
          {/* 공통 필드 */}
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

          {/* Vendor 필드 */}
          {createForm.validationType === ValidationTypeValues.VENDOR && (
            <>
              <div className="space-y-2">
                <Label>{t('validation.form.vendorNameLabel')}</Label>
                <Input
                  value={createForm.vendorName}
                  onChange={(e) => set({ vendorName: e.target.value })}
                  placeholder={t('validation.form.vendorNamePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('validation.form.vendorSummaryLabel')}</Label>
                <Textarea
                  value={createForm.vendorSummary}
                  onChange={(e) => set({ vendorSummary: e.target.value })}
                  placeholder={t('validation.form.vendorSummaryPlaceholder')}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('validation.form.receivedByLabel')}</Label>
                  <UserCombobox
                    value={createForm.receivedBy || undefined}
                    onChange={(id) => set({ receivedBy: id ?? '' })}
                    placeholder={t('validation.form.receivedByPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('validation.form.receivedDateLabel')}</Label>
                  <Input
                    type="date"
                    value={createForm.receivedDate}
                    onChange={(e) => set({ receivedDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('validation.form.attachmentNoteLabel')}</Label>
                <Textarea
                  value={createForm.attachmentNote}
                  onChange={(e) => set({ attachmentNote: e.target.value })}
                  placeholder={t('validation.form.attachmentNotePlaceholder')}
                />
              </div>
            </>
          )}

          {/* Self 필드 */}
          {createForm.validationType === ValidationTypeValues.SELF && (
            <>
              <h4 className="text-sm font-semibold pt-2">
                {t('validation.form.selfBasicInfoTitle')}
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(
                  [
                    ['referenceDocuments', 'referenceDocumentsPlaceholder'],
                    ['operatingUnitDescription', 'operatingUnitPlaceholder'],
                    ['softwareComponents', 'softwareComponentsPlaceholder'],
                    ['hardwareComponents', 'hardwareComponentsPlaceholder'],
                  ] as const
                ).map(([field, placeholder]) => (
                  <div key={field} className="space-y-2">
                    <Label>{t(`validation.form.${field}Label`)}</Label>
                    <Textarea
                      value={createForm[field]}
                      onChange={(e) => set({ [field]: e.target.value })}
                      placeholder={t(`validation.form.${placeholder}`)}
                      className="min-h-[80px]"
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label>{t('validation.form.performedByLabel')}</Label>
                <UserCombobox
                  value={createForm.performedBy || undefined}
                  onChange={(id) => set({ performedBy: id ?? '' })}
                  placeholder={t('validation.form.performedByPlaceholder')}
                />
              </div>
              <ValidationFunctionsTable
                title={t('validation.form.acquisitionTitle')}
                description={t('validation.form.acquisitionDesc')}
                items={createForm.acquisitionFunctions}
                onItemsChange={(items) => set({ acquisitionFunctions: items })}
              />
              <ValidationFunctionsTable
                title={t('validation.form.processingTitle')}
                description={t('validation.form.processingDesc')}
                items={createForm.processingFunctions}
                onItemsChange={(items) => set({ processingFunctions: items })}
              />
              <ValidationControlTable
                items={createForm.controlFunctions}
                onItemsChange={(items) => set({ controlFunctions: items })}
              />
            </>
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
