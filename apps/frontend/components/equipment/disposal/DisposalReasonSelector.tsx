'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DISPOSAL_REASON_LABELS, type DisposalReason } from '@equipment-management/schemas';

interface DisposalReasonSelectorProps {
  value: DisposalReason | '';
  onValueChange: (value: DisposalReason) => void;
}

export function DisposalReasonSelector({ value, onValueChange }: DisposalReasonSelectorProps) {
  const reasons = Object.entries(DISPOSAL_REASON_LABELS) as [DisposalReason, string][];

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">
        폐기 사유 <span className="text-red-500">*</span>
      </Label>
      <RadioGroup
        value={value}
        onValueChange={onValueChange}
        role="radiogroup"
        aria-required="true"
        className="space-y-2"
      >
        {reasons.map(([reasonValue, label]) => (
          <div key={reasonValue} className="flex items-center space-x-2">
            <RadioGroupItem value={reasonValue} id={`reason-${reasonValue}`} />
            <Label htmlFor={`reason-${reasonValue}`} className="font-normal cursor-pointer">
              {label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
