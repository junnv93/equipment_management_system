'use client';

import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { INSPECTION_CHECK_ITEM_PRESETS } from '@equipment-management/shared-constants';

interface CheckItemPresetSelectProps {
  onSelect: (checkItem: string, checkCriteria: string) => void;
}

export default function CheckItemPresetSelect({ onSelect }: CheckItemPresetSelectProps) {
  const t = useTranslations('calibration.intermediateInspection');

  return (
    <Select
      onValueChange={(key) => {
        if (key === 'custom') {
          onSelect('', '');
          return;
        }
        const preset = INSPECTION_CHECK_ITEM_PRESETS.find((p) => p.key === key);
        if (preset) {
          onSelect(preset.checkItem, preset.checkCriteria);
        }
      }}
    >
      <SelectTrigger aria-label={t('items.selectPreset')}>
        <SelectValue placeholder={t('items.selectPreset')} />
      </SelectTrigger>
      <SelectContent>
        {INSPECTION_CHECK_ITEM_PRESETS.map((preset) => (
          <SelectItem key={preset.key} value={preset.key}>
            {preset.checkItem}
          </SelectItem>
        ))}
        <SelectItem value="custom">{t('items.customItem')}</SelectItem>
      </SelectContent>
    </Select>
  );
}
