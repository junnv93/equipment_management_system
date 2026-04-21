'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserCombobox } from '@/components/ui/user-combobox';
import type { CreateFormState } from './ValidationCreateDialog';

interface VendorValidationFieldsProps {
  form: CreateFormState;
  set: (patch: Partial<CreateFormState>) => void;
}

export function VendorValidationFields({ form, set }: VendorValidationFieldsProps) {
  const t = useTranslations('software');
  return (
    <>
      <div className="space-y-2">
        <Label>{t('validation.form.vendorNameLabel')}</Label>
        <Input
          value={form.vendorName}
          onChange={(e) => set({ vendorName: e.target.value })}
          placeholder={t('validation.form.vendorNamePlaceholder')}
        />
      </div>
      <div className="space-y-2">
        <Label>{t('validation.form.vendorSummaryLabel')}</Label>
        <Textarea
          value={form.vendorSummary}
          onChange={(e) => set({ vendorSummary: e.target.value })}
          placeholder={t('validation.form.vendorSummaryPlaceholder')}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t('validation.form.receivedByLabel')}</Label>
          <UserCombobox
            value={form.receivedBy || undefined}
            onChange={(id) => set({ receivedBy: id ?? '' })}
            placeholder={t('validation.form.receivedByPlaceholder')}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('validation.form.receivedDateLabel')}</Label>
          <Input
            type="date"
            value={form.receivedDate}
            onChange={(e) => set({ receivedDate: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t('validation.form.attachmentNoteLabel')}</Label>
        <Textarea
          value={form.attachmentNote}
          onChange={(e) => set({ attachmentNote: e.target.value })}
          placeholder={t('validation.form.attachmentNotePlaceholder')}
        />
      </div>
    </>
  );
}
