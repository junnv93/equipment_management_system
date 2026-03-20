'use client';

import { XCircle } from 'lucide-react';
import { CHECKOUT_MINI_PROGRESS, MINI_PROGRESS_SPECIAL_STATUSES } from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';
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
 * - hidden sm:flex — 모바일에서 숨김
 */
export function CheckoutMiniProgress({ currentStatus, checkoutType }: CheckoutMiniProgressProps) {
  const t = useTranslations('checkouts');
  const isSpecial = (MINI_PROGRESS_SPECIAL_STATUSES as readonly string[]).includes(currentStatus);

  if (isSpecial) {
    const label = currentStatus === CSVal.REJECTED ? t('status.rejected') : t('status.canceled');
    return (
      <div
        role="img"
        aria-label={label}
        className={`hidden sm:flex items-center ${CHECKOUT_MINI_PROGRESS.special[currentStatus as 'rejected' | 'canceled']}`}
      >
        <XCircle className="h-3 w-3" aria-hidden="true" />
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

  const ariaLabel = t('groupCard.progressLabel', {
    current: isFullyComplete ? stepCount : currentStepIndex + 1,
    total: stepCount,
  });

  return (
    <div role="img" aria-label={ariaLabel} className="hidden sm:flex items-center gap-0.5">
      {Array.from({ length: stepCount }, (_, index) => {
        const isDone = isFullyComplete || index < currentStepIndex;
        const isCurrent = !isFullyComplete && index === currentStepIndex;

        let dotClass = CHECKOUT_MINI_PROGRESS.dot.base;
        if (isDone) dotClass += ` ${CHECKOUT_MINI_PROGRESS.dot.completed}`;
        else if (isCurrent && isLate) dotClass += ` ${CHECKOUT_MINI_PROGRESS.dot.late}`;
        else if (isCurrent) dotClass += ` ${CHECKOUT_MINI_PROGRESS.dot.current}`;
        else dotClass += ` ${CHECKOUT_MINI_PROGRESS.dot.future}`;

        const dotContent = isDone ? '✓' : isCurrent ? '!' : String(index + 1);

        return (
          <span key={index} className="flex items-center gap-0.5">
            {index > 0 && (
              <span
                className={`${CHECKOUT_MINI_PROGRESS.connector.base} ${
                  index <= currentStepIndex
                    ? CHECKOUT_MINI_PROGRESS.connector.completed
                    : CHECKOUT_MINI_PROGRESS.connector.pending
                }`}
              />
            )}
            <span className={dotClass} aria-hidden="true">
              {dotContent}
            </span>
          </span>
        );
      })}
    </div>
  );
}
