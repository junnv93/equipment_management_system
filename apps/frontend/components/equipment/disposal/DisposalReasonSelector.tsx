'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { type DisposalReason } from '@equipment-management/schemas';
import { useTranslations } from 'next-intl';

interface DisposalReasonSelectorProps {
  value: DisposalReason | '';
  onValueChange: (value: DisposalReason) => void;
}

const REASON_KEYS: DisposalReason[] = [
  'end_of_life',
  'beyond_repair',
  'obsolete',
  'damaged',
  'other',
];

export function DisposalReasonSelector({ value, onValueChange }: DisposalReasonSelectorProps) {
  const t = useTranslations('disposal');

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">
        {t('reasonSelector.label')} <span className="text-red-500">*</span>
      </Label>
      <RadioGroup
        value={value}
        onValueChange={onValueChange}
        role="radiogroup"
        aria-required="true"
        className="space-y-2"
      >
        {REASON_KEYS.map((reasonValue) => (
          <div key={reasonValue} className="flex items-center space-x-2">
            <RadioGroupItem value={reasonValue} id={`reason-${reasonValue}`} />
            <Label htmlFor={`reason-${reasonValue}`} className="font-normal cursor-pointer">
              {t(`reason.${reasonValue}`)}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
