'use client';

import { useTranslations } from 'next-intl';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ControlItem } from '@equipment-management/schemas';

interface ValidationControlTableProps {
  items: ControlItem[];
  onItemsChange: (items: ControlItem[]) => void;
}

export function ValidationControlTable({ items, onItemsChange }: ValidationControlTableProps) {
  const t = useTranslations('software');

  const addItem = () =>
    onItemsChange([
      ...items,
      {
        equipmentFunction: '',
        expectedFunction: '',
        observedFunction: '',
        independentMethod: '',
        acceptanceCriteria: '',
      },
    ]);

  const removeItem = (idx: number) => onItemsChange(items.filter((_, i) => i !== idx));

  const updateItem = (idx: number, field: keyof ControlItem, value: string) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    onItemsChange(updated);
  };

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold">{t('validation.form.controlTitle')}</h4>
          <p className="text-xs text-muted-foreground">{t('validation.form.controlDesc')}</p>
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
        <div key={idx} className="space-y-2 border rounded-md p-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground">#{idx + 1}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(idx)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['equipmentFunction', 'equipmentFunctionPlaceholder'],
                ['expectedFunction', 'expectedFunctionPlaceholder'],
                ['observedFunction', 'observedFunctionPlaceholder'],
                ['independentMethod', 'independentMethodPlaceholder'],
              ] as const
            ).map(([field, placeholder]) => (
              <div key={field} className="space-y-1">
                <Label className="text-xs">{t(`validation.form.${field}`)}</Label>
                <Input
                  value={item[field] ?? ''}
                  onChange={(e) => updateItem(idx, field, e.target.value)}
                  placeholder={t(`validation.form.${placeholder}`)}
                />
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t('validation.form.acceptanceCriteria')}</Label>
            <Input
              value={item.acceptanceCriteria ?? ''}
              onChange={(e) => updateItem(idx, 'acceptanceCriteria', e.target.value)}
              placeholder={t('validation.form.acceptanceCriteriaPlaceholder')}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
