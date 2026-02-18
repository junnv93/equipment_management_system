'use client';

import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DISPOSAL_STEPPER_TOKENS,
  getStepperNodeClasses,
  getStepperLabelClasses,
} from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';

interface DisposalProgressStepperProps {
  currentStep: number;
  className?: string;
}

const STEP_KEYS = ['request', 'review', 'approval'] as const;

export function DisposalProgressStepper({ currentStep, className }: DisposalProgressStepperProps) {
  const t = useTranslations('disposal.stepper');
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      {STEP_KEYS.map((key, index) => {
        const stepId = index + 1;
        const isCompleted = stepId < currentStep;
        const isCurrent = stepId === currentStep;

        const status = isCompleted ? 'completed' : isCurrent ? 'current' : 'pending';

        return (
          <div key={key} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={getStepperNodeClasses(status)}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? (
                  <Check className={DISPOSAL_STEPPER_TOKENS.icon} />
                ) : (
                  <Circle className={DISPOSAL_STEPPER_TOKENS.icon} />
                )}
              </div>
              <span className={getStepperLabelClasses(status)}>{t(key)}</span>
            </div>
            {index < STEP_KEYS.length - 1 && (
              <div
                className={cn(
                  DISPOSAL_STEPPER_TOKENS.connector.base,
                  stepId < currentStep
                    ? DISPOSAL_STEPPER_TOKENS.connector.completed
                    : DISPOSAL_STEPPER_TOKENS.connector.pending
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
