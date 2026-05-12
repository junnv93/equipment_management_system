'use client';

import { useTranslations } from 'next-intl';
import { Plus, Info, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { InspectionJudgment } from '@equipment-management/schemas';
import {
  INSPECTION_SPACING,
  INSPECTION_EMPTY_STATE,
  INSPECTION_PREFILL,
  INSPECTION_FORM_LAYOUT,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import CheckItemPresetSelect from '../CheckItemPresetSelect';
import { InspectionItemCard } from './InspectionItemCard';

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
            <InspectionItemCard
              key={index}
              item={item}
              index={index}
              onItemChange={onItemChange}
              onRemoveItem={onRemoveItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
