'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { APPROVAL_ROW_TOKENS } from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';

interface ApprovalRowMiniStepperProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

/**
 * 다단계 승인 인라인 진행 도트 — 행 요약 컬럼 내 컴팩트 표시
 *
 * ARIA: role="progressbar" — '●'.repeat 패턴 제거 (스크린리더 "filled circle" 반복 방지)
 * 색: brand CSS 변수 경유 (dark: prefix 0)
 */
export const ApprovalRowMiniStepper = memo(function ApprovalRowMiniStepper({
  currentStep,
  totalSteps,
  className,
}: ApprovalRowMiniStepperProps) {
  const t = useTranslations('approvals');
  const tokens = APPROVAL_ROW_TOKENS.miniStepper;

  if (totalSteps <= 0) return null;

  return (
    <span
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={0}
      aria-valuemax={totalSteps}
      aria-label={t('miniStepper.aria.label', { current: currentStep, total: totalSteps })}
      className={cn(tokens.container, className)}
    >
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNumber = i + 1;
        const isCompleted = stepNumber <= currentStep;
        const isCurrent = stepNumber === currentStep + 1 && currentStep < totalSteps;

        return (
          <span
            key={i}
            aria-hidden="true"
            className={cn(
              tokens.dot.base,
              isCompleted
                ? tokens.dot.completed
                : isCurrent
                  ? tokens.dot.current
                  : tokens.dot.pending
            )}
          />
        );
      })}
      <span className={tokens.label}>
        {currentStep}/{totalSteps}
      </span>
    </span>
  );
});
