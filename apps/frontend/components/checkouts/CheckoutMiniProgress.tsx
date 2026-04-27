'use client';

import { XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  CHECKOUT_MINI_PROGRESS,
  CHECKOUT_ITEM_ROW_TOKENS,
  MINI_PROGRESS_SPECIAL_STATUSES,
  CHECKOUT_STEP_LABELS,
} from '@/lib/design-tokens';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  CheckoutStatusValues as CSVal,
  CheckoutPurposeValues as CPVal,
  type CheckoutStatus,
  type NextStepDescriptor,
} from '@equipment-management/schemas';

interface CheckoutMiniProgressProps {
  currentStatus: string;
  checkoutType: 'calibration' | 'repair' | 'rental';
  /** FSM descriptor — 제공 시 currentStepIndex/totalSteps/urgency를 descriptor 기반으로 계산 */
  descriptor?: NextStepDescriptor;
  /**
   * inline: 기존 수평 도트 진행바 (default)
   * tooltipButton: 7×7 버튼 + Tooltip — Sprint 4.2 Row Zone 4 보조 정보
   */
  variant?: 'inline' | 'tooltipButton';
}

/**
 * 반출 상태 흐름 미니 프로그레스 (18px 원 + 커넥터)
 *
 * variant=inline:         도트 진행바 (기존 동작, default)
 * variant=tooltipButton:  7×7 버튼 + Tooltip — Sprint 4.2 Row Zone 4에서 사용
 */
export function CheckoutMiniProgress({
  currentStatus,
  checkoutType,
  descriptor,
  variant = 'inline',
}: CheckoutMiniProgressProps) {
  const t = useTranslations('checkouts');
  const isSpecial = (MINI_PROGRESS_SPECIAL_STATUSES as readonly string[]).includes(currentStatus);

  if (isSpecial) {
    const label = currentStatus === CSVal.REJECTED ? t('status.rejected') : t('status.canceled');
    const iconEl = (
      <XCircle
        className={`h-3 w-3 ${CHECKOUT_MINI_PROGRESS.special[currentStatus as 'rejected' | 'canceled']}`}
        aria-hidden="true"
      />
    );

    if (variant === 'tooltipButton') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={CHECKOUT_ITEM_ROW_TOKENS.miniProgressTooltipButton}
                role="img"
                aria-label={label}
              >
                {iconEl}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <div role="img" aria-label={label} className="flex items-center">
        {iconEl}
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  const stepCount = descriptor?.totalSteps ?? CHECKOUT_MINI_PROGRESS.stepCount[checkoutType] ?? 4;
  const isFullyComplete =
    currentStatus === CSVal.RETURN_APPROVED ||
    (checkoutType === CPVal.RENTAL && currentStatus === CSVal.LENDER_RECEIVED);
  const isLate = currentStatus === CSVal.OVERDUE || descriptor?.urgency === 'critical';
  const currentStepIndex =
    descriptor?.currentStepIndex ??
    (isFullyComplete
      ? stepCount
      : (CHECKOUT_MINI_PROGRESS.statusToStepIndex[currentStatus as CheckoutStatus] ?? 0));

  const currentStepNumber = isFullyComplete ? stepCount : currentStepIndex + 1;
  const stepLabelKey = CHECKOUT_STEP_LABELS[currentStatus];
  const stepName = stepLabelKey ? t(`stepper.${stepLabelKey}`) : currentStatus;

  const ariaLabel = t(
    isLate ? 'groupCard.progressLabelOverdue' : 'groupCard.progressLabelWithStep',
    { stepName, current: currentStepNumber, total: stepCount }
  );

  const dotsEl = (
    <>
      {Array.from({ length: stepCount }, (_, index) => {
        const isDone = isFullyComplete || index < currentStepIndex;
        const isCurrent = !isFullyComplete && index === currentStepIndex;
        const dotStepKey = Object.entries(CHECKOUT_MINI_PROGRESS.statusToStepIndex).find(
          ([, v]) => v === index
        )?.[0];
        const dotLabel = dotStepKey
          ? t(`stepper.${CHECKOUT_STEP_LABELS[dotStepKey] ?? dotStepKey}`)
          : String(index + 1);

        let dotClass = `hidden sm:flex ${CHECKOUT_MINI_PROGRESS.dot.base}`;
        if (isDone) dotClass += ` ${CHECKOUT_MINI_PROGRESS.dot.completed}`;
        else if (isCurrent && isLate) dotClass += ` ${CHECKOUT_MINI_PROGRESS.dot.late}`;
        else if (isCurrent) dotClass += ` ${CHECKOUT_MINI_PROGRESS.dot.current}`;
        else dotClass += ` ${CHECKOUT_MINI_PROGRESS.dot.future}`;

        const dotContent = isDone ? '✓' : isCurrent ? '!' : String(index + 1);

        return (
          <span key={index} className="hidden sm:flex items-center gap-0.5">
            {index > 0 && (
              <span
                className={`${CHECKOUT_MINI_PROGRESS.connector.base} ${
                  index <= currentStepIndex
                    ? CHECKOUT_MINI_PROGRESS.connector.completed
                    : CHECKOUT_MINI_PROGRESS.connector.pending
                }`}
              />
            )}
            <span className={dotClass} title={dotLabel} aria-hidden="true">
              {dotContent}
            </span>
          </span>
        );
      })}
    </>
  );

  if (variant === 'tooltipButton') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={CHECKOUT_ITEM_ROW_TOKENS.miniProgressTooltipButton}
              aria-label={t('groupCard.progressTooltipAria', {
                current: currentStepNumber,
                total: stepCount,
              })}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-xs font-medium tabular-nums">
                {currentStepNumber}/{stepCount}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <div role="img" aria-label={ariaLabel} className="flex items-center gap-0.5">
              {dotsEl}
            </div>
            <p className="text-xs mt-1 text-muted-foreground">{ariaLabel}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div role="img" aria-label={ariaLabel} className="flex items-center gap-0.5">
      <span className="sm:hidden text-xs text-muted-foreground">
        {stepName} ({currentStepNumber}/{stepCount})
      </span>
      {dotsEl}
    </div>
  );
}

/** tooltipButton variant alias — Zone 4 용도 명시적 re-export */
export { CheckoutMiniProgress as MiniProgressTooltipButton };
