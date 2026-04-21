'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserCombobox } from '@/components/ui/user-combobox';
import { ValidationFunctionsTable } from './ValidationFunctionsTable';
import { ValidationControlTable } from './ValidationControlTable';
import type { CreateFormState } from './validation-create-form.types';

interface SelfValidationFieldsProps {
  form: CreateFormState;
  set: (patch: Partial<CreateFormState>) => void;
}

const SELF_TEXT_FIELDS = [
  ['referenceDocuments', 'referenceDocumentsPlaceholder'],
  ['operatingUnitDescription', 'operatingUnitPlaceholder'],
  ['softwareComponents', 'softwareComponentsPlaceholder'],
  ['hardwareComponents', 'hardwareComponentsPlaceholder'],
] as const;

export function SelfValidationFields({ form, set }: SelfValidationFieldsProps) {
  const t = useTranslations('software');
  return (
    <>
      <h4 className="text-sm font-semibold pt-2">{t('validation.form.selfBasicInfoTitle')}</h4>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SELF_TEXT_FIELDS.map(([field, placeholder]) => (
          <div key={field} className="space-y-2">
            <Label>{t(`validation.form.${field}Label`)}</Label>
            <Textarea
              value={form[field]}
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
          value={form.performedBy || undefined}
          onChange={(id) => set({ performedBy: id ?? '' })}
          placeholder={t('validation.form.performedByPlaceholder')}
        />
      </div>
      <ValidationFunctionsTable
        title={t('validation.form.acquisitionTitle')}
        description={t('validation.form.acquisitionDesc')}
        items={form.acquisitionFunctions}
        onItemsChange={(items) => set({ acquisitionFunctions: items })}
      />
      <ValidationFunctionsTable
        title={t('validation.form.processingTitle')}
        description={t('validation.form.processingDesc')}
        items={form.processingFunctions}
        onItemsChange={(items) => set({ processingFunctions: items })}
      />
      <ValidationControlTable
        items={form.controlFunctions}
        onItemsChange={(items) => set({ controlFunctions: items })}
      />
    </>
  );
}
