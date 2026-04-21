'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserCombobox } from '@/components/ui/user-combobox';
import type { EditForm } from './ValidationEditDialog';

interface VendorEditFieldsProps {
  editForm: EditForm;
  setEditForm: React.Dispatch<React.SetStateAction<EditForm | null>>;
}

export function VendorEditFields({ editForm, setEditForm }: VendorEditFieldsProps) {
  const t = useTranslations('software');

  return (
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
  );
}
