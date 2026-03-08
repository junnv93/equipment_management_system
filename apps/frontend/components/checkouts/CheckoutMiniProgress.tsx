'use client';

import { AlertTriangle, XCircle } from 'lucide-react';
import {
  CHECKOUT_MINI_PROGRESS,
  MINI_PROGRESS_STEPS,
  MINI_PROGRESS_SPECIAL_STATUSES,
} from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';

interface CheckoutMiniProgressProps {
  currentStatus: string;
  checkoutType: 'calibration' | 'repair' | 'rental';
}

/**
 * 반출 상태 흐름 미니 프로그레스 (4개 점 + 3개 커넥터)
 *
 * - completed: bg-brand-ok (초록 채움)
 * - current:   border-brand-info (파랑 링)
 * - future:    bg-brand-neutral/30 (회색 빈 원)
 * - 특수 상태(overdue/rejected/canceled): 점 대신 아이콘
 * - return_approved: 전체 완료 표시
 * - hidden sm:flex — 모바일에서 숨김
 */
export function CheckoutMiniProgress({ currentStatus, checkoutType }: CheckoutMiniProgressProps) {
  const t = useTranslations('checkouts');
  const steps = MINI_PROGRESS_STEPS[checkoutType] ?? MINI_PROGRESS_STEPS.calibration;
  const isSpecial = (MINI_PROGRESS_SPECIAL_STATUSES as readonly string[]).includes(currentStatus);
  const isFullyComplete = currentStatus === 'return_approved';
  const currentStepIndex = (steps as readonly string[]).indexOf(currentStatus);

  if (isSpecial) {
    const label =
      currentStatus === 'overdue'
        ? t('status.overdue')
        : currentStatus === 'rejected'
          ? t('status.rejected')
          : t('status.canceled');

    return (
      <div
        role="img"
        aria-label={label}
        className={`hidden sm:flex items-center ${CHECKOUT_MINI_PROGRESS.special[currentStatus as keyof typeof CHECKOUT_MINI_PROGRESS.special]}`}
      >
        {currentStatus === 'overdue' && <AlertTriangle className="h-3 w-3" aria-hidden="true" />}
        {(currentStatus === 'rejected' || currentStatus === 'canceled') && (
          <XCircle className="h-3 w-3" aria-hidden="true" />
        )}
      </div>
    );
  }

  const completedCount = isFullyComplete ? steps.length : Math.max(0, currentStepIndex);
  const ariaLabel = t('groupCard.progressLabel', {
    current: isFullyComplete ? steps.length : currentStepIndex + 1,
    total: steps.length,
  });

  return (
    <div role="img" aria-label={ariaLabel} className="hidden sm:flex items-center gap-0.5">
      {(steps as readonly string[]).map((step, index) => {
        const isDone = isFullyComplete || index < currentStepIndex;
        const isCurrent = !isFullyComplete && index === currentStepIndex;

        let dotClass = `rounded-full ${CHECKOUT_MINI_PROGRESS.dot.size}`;
        if (isDone) dotClass += ` ${CHECKOUT_MINI_PROGRESS.dot.completed}`;
        else if (isCurrent) dotClass += ` ${CHECKOUT_MINI_PROGRESS.dot.current}`;
        else dotClass += ` ${CHECKOUT_MINI_PROGRESS.dot.future}`;

        return (
          <span key={step} className="flex items-center gap-0.5">
            {index > 0 && (
              <span
                className={`${CHECKOUT_MINI_PROGRESS.connector.base} ${
                  index <= completedCount
                    ? CHECKOUT_MINI_PROGRESS.connector.completed
                    : CHECKOUT_MINI_PROGRESS.connector.pending
                }`}
              />
            )}
            <span className={dotClass} />
          </span>
        );
      })}
    </div>
  );
}
