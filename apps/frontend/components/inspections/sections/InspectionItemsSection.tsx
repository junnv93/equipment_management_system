'use client';

import { useTranslations } from 'next-intl';
import { Plus, Trash2, Info, ClipboardList } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { InspectionJudgment } from '@equipment-management/schemas';
import {
  INSPECTION_SPACING,
  INSPECTION_ITEM_CARD,
  INSPECTION_EMPTY_STATE,
  INSPECTION_PREFILL,
  INSPECTION_FORM_LAYOUT,
  getJudgmentCardClasses,
  ANIMATION_PRESETS,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import CheckItemPresetSelect from '../CheckItemPresetSelect';

export interface InspectionItemForm {
  checkItem: string;
  checkCriteria: string;
  checkResult: string;
  judgment: InspectionJudgment | '';
}

interface TemplatePrefill {
  items: InspectionItemForm[];
}

export interface InspectionItemsSectionProps {
  items: InspectionItemForm[];
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onItemChange: (index: number, field: keyof InspectionItemForm, value: string) => void;
  onAddPresetItem: (checkItem: string, checkCriteria: string) => void;
  templatePrefill: TemplatePrefill | null;
  usePreviousInspection: boolean;
  previousInspectionApplied: boolean;
  onTogglePreviousInspection: (checked: boolean) => void;
}

export function InspectionItemsSection({
  items,
  onAddItem,
  onRemoveItem,
  onItemChange,
  onAddPresetItem,
  templatePrefill,
  usePreviousInspection,
  previousInspectionApplied,
  onTogglePreviousInspection,
}: InspectionItemsSectionProps) {
  const t = useTranslations('calibration');

  return (
    <div className={INSPECTION_SPACING.group}>
      <div className={INSPECTION_FORM_LAYOUT.sectionHeader}>
        <Label className="text-base font-semibold">{t('intermediateInspection.items.title')}</Label>
        <div className="flex gap-2">
          <CheckItemPresetSelect onSelect={onAddPresetItem} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddItem}
            aria-label={t('intermediateInspection.items.addItem')}
          >
            <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
            {t('intermediateInspection.items.addItem')}
          </Button>
        </div>
      </div>

      {templatePrefill && templatePrefill.items.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-dashed bg-muted/30 p-3">
          <Checkbox
            id="use-previous-inspection"
            checked={usePreviousInspection}
            onCheckedChange={(checked) => onTogglePreviousInspection(checked === true)}
            className="mt-0.5"
          />
          <div className="flex-1 space-y-0.5">
            <Label htmlFor="use-previous-inspection" className="cursor-pointer text-sm font-medium">
              {t('intermediateInspection.prefill.usePreviousLabel')}
              {previousInspectionApplied && (
                <Badge variant="secondary" className={cn(INSPECTION_PREFILL.badge, 'ml-2')}>
                  <Info className={INSPECTION_PREFILL.icon} />
                  {t('intermediateInspection.prefill.auto')}
                </Badge>
              )}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t('intermediateInspection.prefill.usePreviousDescription', {
                count: templatePrefill.items.length,
              })}
            </p>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className={INSPECTION_EMPTY_STATE.container}>
          <ClipboardList className={INSPECTION_EMPTY_STATE.icon} aria-hidden="true" />
          <p className={INSPECTION_EMPTY_STATE.title}>
            {t('intermediateInspection.items.noItems')}
          </p>
          <p className={INSPECTION_EMPTY_STATE.description}>
            {t('intermediateInspection.items.noItemsDescription')}
          </p>
        </div>
      ) : (
        <div className={INSPECTION_SPACING.group}>
          {items.map((item, index) => (
            <div
              key={index}
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
                  <Select
                    value={item.judgment}
                    onValueChange={(v) => onItemChange(index, 'judgment', v)}
                  >
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
          ))}
        </div>
      )}
    </div>
  );
}
