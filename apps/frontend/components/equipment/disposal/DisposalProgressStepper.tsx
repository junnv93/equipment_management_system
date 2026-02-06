import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DisposalProgressStepperProps {
  currentStep: number;
  className?: string;
}

const steps = [
  { id: 1, label: '요청' },
  { id: 2, label: '검토' },
  { id: 3, label: '승인' },
];

export function DisposalProgressStepper({ currentStep, className }: DisposalProgressStepperProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      {steps.map((step, index) => {
        const isCompleted = step.id < currentStep;
        const isCurrent = step.id === currentStep;
        const isPending = step.id > currentStep;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2',
                  isCompleted && 'border-green-500 bg-green-500 text-white',
                  isCurrent && 'border-orange-500 bg-orange-500 text-white',
                  isPending && 'border-gray-200 bg-white text-gray-400'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
              </div>
              <span
                className={cn(
                  'text-xs font-medium',
                  isCompleted && 'text-green-700',
                  isCurrent && 'text-orange-700',
                  isPending && 'text-gray-400'
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'mx-2 h-[2px] w-12',
                  step.id < currentStep ? 'bg-green-500' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
