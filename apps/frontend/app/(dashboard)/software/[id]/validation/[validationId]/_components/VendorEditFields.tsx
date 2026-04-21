'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserCombobox } from '@/components/ui/user-combobox';
import type { EditForm } from './ValidationEditDialog';

interface VendorEditFieldsProps {
  editForm: EditForm;
  setEditForm: (value: EditForm) => void;
}

export function VendorEditFields({ editForm, setEditForm }: VendorEditFieldsProps) {
  const t = useTranslations('software');

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="edit-vendor-name">{t('validation.form.vendorNameLabel')}</Label>
        <Input
          id="edit-vendor-name"
          value={editForm.vendorName}
          onChange={(e) => setEditForm({ ...editForm, vendorName: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-vendor-summary">{t('validation.form.vendorSummaryLabel')}</Label>
        <Textarea
          id="edit-vendor-summary"
          value={editForm.vendorSummary}
          onChange={(e) => setEditForm({ ...editForm, vendorSummary: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label id="edit-received-by-label">{t('validation.form.receivedByLabel')}</Label>
          <UserCombobox
            value={editForm.receivedBy || undefined}
            onChange={(id) => setEditForm({ ...editForm, receivedBy: id ?? '' })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-received-date">{t('validation.form.receivedDateLabel')}</Label>
          <Input
            id="edit-received-date"
            type="date"
            value={editForm.receivedDate}
            onChange={(e) => setEditForm({ ...editForm, receivedDate: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-attachment-note">{t('validation.form.attachmentNoteLabel')}</Label>
        <Textarea
          id="edit-attachment-note"
          value={editForm.attachmentNote}
          onChange={(e) => setEditForm({ ...editForm, attachmentNote: e.target.value })}
          placeholder={t('validation.form.attachmentNotePlaceholder')}
        />
      </div>
    </>
  );
}
