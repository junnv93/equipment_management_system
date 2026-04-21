'use client';

import { useTranslations } from 'next-intl';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FunctionItem } from './ValidationCreateDialog';

interface ValidationFunctionsTableProps {
  title: string;
  description: string;
  items: FunctionItem[];
  onItemsChange: (items: FunctionItem[]) => void;
}

export function ValidationFunctionsTable({
  title,
  description,
  items,
  onItemsChange,
}: ValidationFunctionsTableProps) {
  const t = useTranslations('software');

  const addItem = () =>
    onItemsChange([...items, { functionName: '', independentMethod: '', acceptanceCriteria: '' }]);

  const removeItem = (idx: number) => onItemsChange(items.filter((_, i) => i !== idx));

  const updateItem = (idx: number, field: string, value: string) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    onItemsChange(updated);
  };

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold">{title}</h4>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="mr-1 h-3 w-3" />
          {t('validation.form.addFunction')}
        </Button>
      </div>
      {items.length === 0 && (
        <p className="text-xs text-muted-foreground italic">{t('validation.form.noFunctions')}</p>
      )}
      {items.map((item, idx) => (
        <div key={idx} className="grid grid-cols-3 gap-2 items-end border rounded-md p-3">
          <div className="space-y-1">
            <Label className="text-xs">{t('validation.form.functionName')}</Label>
            <Input
              value={item.functionName ?? ''}
              onChange={(e) => updateItem(idx, 'functionName', e.target.value)}
              placeholder={t('validation.form.functionNamePlaceholder')}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t('validation.form.independentMethod')}</Label>
            <Input
              value={item.independentMethod ?? ''}
              onChange={(e) => updateItem(idx, 'independentMethod', e.target.value)}
              placeholder={t('validation.form.independentMethodPlaceholder')}
            />
          </div>
          <div className="flex gap-2 items-end">
            <div className="space-y-1 flex-1">
              <Label className="text-xs">{t('validation.form.acceptanceCriteria')}</Label>
              <Input
                value={item.acceptanceCriteria ?? ''}
                onChange={(e) => updateItem(idx, 'acceptanceCriteria', e.target.value)}
                placeholder={t('validation.form.acceptanceCriteriaPlaceholder')}
              />
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(idx)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
