'use client';

import { useTranslations } from 'next-intl';
import { Trash2, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  INSPECTION_SPACING,
  INSPECTION_EMPTY_STATE,
  INSPECTION_FORM_LAYOUT,
} from '@/lib/design-tokens';
import { EquipmentCombobox } from '@/components/ui/equipment-combobox';

interface MeasurementEquipmentItem {
  equipmentId: string;
  equipmentName: string;
  managementNumber: string;
  calibrationDate: string;
}

export interface MeasurementEquipmentSectionProps {
  measurementEquipment: MeasurementEquipmentItem[];
  onAdd: (equipmentId: string | undefined) => void;
  onRemove: (index: number) => void;
}

export function MeasurementEquipmentSection({
  measurementEquipment,
  onAdd,
  onRemove,
}: MeasurementEquipmentSectionProps) {
  const t = useTranslations('calibration');

  return (
    <div className={INSPECTION_SPACING.group}>
      <div className={INSPECTION_FORM_LAYOUT.sectionHeader}>
        <Label className="text-base font-semibold">
          {t('intermediateInspection.measurementEquipment.title')}
        </Label>
        <EquipmentCombobox
          value={undefined}
          onChange={onAdd}
          placeholder={t('intermediateInspection.measurementEquipment.searchPlaceholder')}
          excludeIds={measurementEquipment.map((me) => me.equipmentId)}
        />
      </div>

      {measurementEquipment.length === 0 ? (
        <div className={INSPECTION_EMPTY_STATE.container}>
          <Wrench className={INSPECTION_EMPTY_STATE.icon} aria-hidden="true" />
          <p className={INSPECTION_EMPTY_STATE.title}>
            {t('intermediateInspection.measurementEquipment.empty')}
          </p>
          <p className={INSPECTION_EMPTY_STATE.description}>
            {t('intermediateInspection.measurementEquipment.emptyDescription')}
          </p>
        </div>
      ) : (
        <div className="rounded border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-xs">
                <th className="text-left px-3 py-2 font-medium">#</th>
                <th className="text-left px-3 py-2 font-medium">
                  {t('intermediateInspection.measurementEquipment.managementNumber')}
                </th>
                <th className="text-left px-3 py-2 font-medium">
                  {t('intermediateInspection.measurementEquipment.equipmentName')}
                </th>
                <th className="text-left px-3 py-2 font-medium">
                  {t('intermediateInspection.measurementEquipment.calibrationDate')}
                </th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {measurementEquipment.map((me, idx) => (
                <tr key={me.equipmentId} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                  <td className="px-3 py-2 font-mono tabular-nums text-xs">
                    {me.managementNumber}
                  </td>
                  <td className="px-3 py-2">{me.equipmentName}</td>
                  <td className="px-3 py-2 font-mono tabular-nums text-xs">
                    {me.calibrationDate || '—'}
                  </td>
                  <td className="px-1 py-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemove(idx)}
                      aria-label={t('intermediateInspection.items.removeItem')}
                    >
                      <Trash2 className="h-3 w-3" aria-hidden="true" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
