'use client';

import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  INSPECTION_SPACING,
  INSPECTION_ITEM_CARD,
  getJudgmentCardClasses,
  ANIMATION_PRESETS,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import type { InspectionItemForm } from './InspectionItemsSection';

export interface InspectionItemCardProps {
  item: InspectionItemForm;
  index: number;
  onItemChange: (index: number, field: keyof InspectionItemForm, value: string) => void;
  onRemoveItem: (index: number) => void;
}

export function InspectionItemCard({
  item,
  index,
  onItemChange,
  onRemoveItem,
}: InspectionItemCardProps) {
  const t = useTranslations('calibration');

  return (
    <div
      className={cn(
        INSPECTION_ITEM_CARD.base,
        INSPECTION_SPACING.group,
        getJudgmentCardClasses(item.judgment),
        ANIMATION_PRESETS.slideUpFade,
        'motion-safe:duration-200'
      )}
    >
      <div className="flex items-center justify-between">
        <span className={INSPECTION_ITEM_CARD.number}>#{index + 1}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemoveItem(index)}
          aria-label={t('intermediateInspection.items.removeItem')}
        >
          <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
        </Button>
      </div>

      <div className={INSPECTION_ITEM_CARD.fieldGrid}>
        <div className={INSPECTION_SPACING.field}>
          <Label
            htmlFor={`intermediate-inspection-item-${index}-check-item`}
            className={INSPECTION_ITEM_CARD.fieldLabel}
          >
            {t('intermediateInspection.items.checkItem')}
          </Label>
          <Input
            id={`intermediate-inspection-item-${index}-check-item`}
            name={`intermediateInspectionItems.${index}.checkItem`}
            autoComplete="off"
            value={item.checkItem}
            onChange={(e) => onItemChange(index, 'checkItem', e.target.value)}
          />
        </div>
        <div className={INSPECTION_SPACING.field}>
          <Label
            htmlFor={`intermediate-inspection-item-${index}-criteria`}
            className={INSPECTION_ITEM_CARD.fieldLabel}
          >
            {t('intermediateInspection.items.checkCriteria')}
          </Label>
          <Input
            id={`intermediate-inspection-item-${index}-criteria`}
            name={`intermediateInspectionItems.${index}.checkCriteria`}
            autoComplete="off"
            value={item.checkCriteria}
            onChange={(e) => onItemChange(index, 'checkCriteria', e.target.value)}
          />
        </div>
        <div className={INSPECTION_SPACING.field}>
          <Label
            htmlFor={`intermediate-inspection-item-${index}-result`}
            className={INSPECTION_ITEM_CARD.fieldLabel}
          >
            {t('intermediateInspection.items.checkResult')}
          </Label>
          <Input
            id={`intermediate-inspection-item-${index}-result`}
            name={`intermediateInspectionItems.${index}.checkResult`}
            autoComplete="off"
            value={item.checkResult}
            onChange={(e) => onItemChange(index, 'checkResult', e.target.value)}
          />
        </div>
        <div className={INSPECTION_SPACING.field}>
          <Label
            htmlFor={`intermediate-inspection-item-${index}-judgment`}
            className={INSPECTION_ITEM_CARD.fieldLabel}
          >
            {t('intermediateInspection.items.judgment')}
          </Label>
          <Select value={item.judgment} onValueChange={(v) => onItemChange(index, 'judgment', v)}>
            <SelectTrigger id={`intermediate-inspection-item-${index}-judgment`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pass">
                {t('intermediateInspection.items.judgmentOptions.pass')}
              </SelectItem>
              <SelectItem value="fail">
                {t('intermediateInspection.items.judgmentOptions.fail')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
