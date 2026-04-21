'use client';

import { XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  CHECKOUT_MINI_PROGRESS,
  MINI_PROGRESS_SPECIAL_STATUSES,
  CHECKOUT_STEP_LABELS,
} from '@/lib/design-tokens';
import {
  CheckoutStatusValues as CSVal,
  CheckoutPurposeValues as CPVal,
} from '@equipment-management/schemas';

interface CheckoutMiniProgressProps {
  currentStatus: string;
  checkoutType: 'calibration' | 'repair' | 'rental';
}

/**
 * 반출 상태 흐름 미니 프로그레스 (18px 원 + 커넥터)
 *
 * - done:    초록 원 ✓
 * - current: 파랑 원 !
 * - late:    빨강 원 ! (overdue)
 * - future:  흰 원 + 테두리 (단계 번호)
 * - rejected/canceled: XCircle 아이콘 (icon-only)
 * - 모바일: "단계명 (3/5)" 텍스트, 데스크톱: 도트 진행바
 */
export function CheckoutMiniProgress({ currentStatus, checkoutType }: CheckoutMiniProgressProps) {
  const t = useTranslations('checkouts');
  const isSpecial = (MINI_PROGRESS_SPECIAL_STATUSES as readonly string[]).includes(currentStatus);

  if (isSpecial) {
    const label = currentStatus === CSVal.REJECTED ? t('status.rejected') : t('status.canceled');
    return (
      <div role="img" aria-label={label} className="flex items-center">
        <XCircle
          className={`h-3 w-3 ${CHECKOUT_MINI_PROGRESS.special[currentStatus as 'rejected' | 'canceled']}`}
          aria-hidden="true"
        />
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  const stepCount = CHECKOUT_MINI_PROGRESS.stepCount[checkoutType] ?? 4;
  const isFullyComplete =
    currentStatus === CSVal.RETURN_APPROVED ||
    (checkoutType === CPVal.RENTAL && currentStatus === CSVal.LENDER_RECEIVED);
  const isLate = currentStatus === CSVal.OVERDUE;
  const currentStepIndex = isFullyComplete
    ? stepCount
    : (CHECKOUT_MINI_PROGRESS.statusToStepIndex[currentStatus] ?? 0);

  const currentStepNumber = isFullyComplete ? stepCount : currentStepIndex + 1;
  const stepLabelKey = CHECKOUT_STEP_LABELS[currentStatus];
  const stepName = stepLabelKey ? t(`stepper.${stepLabelKey}`) : currentStatus;

  const ariaLabel = t('groupCard.progressLabelWithStep', {
    stepName,
    current: currentStepNumber,
    total: stepCount,
  });

  return (
    <div role="img" aria-label={ariaLabel} className="flex items-center gap-0.5">
      {/* 모바일: 텍스트 축약형 */}
      <span className="sm:hidden text-xs text-muted-foreground">
        {stepName} ({currentStepNumber}/{stepCount})
      </span>

      {/* 데스크톱: 도트 진행바 */}
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
    </div>
  );
}
