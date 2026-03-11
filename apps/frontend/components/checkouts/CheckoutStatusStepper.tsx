'use client';

import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { CheckoutStatus } from '@equipment-management/schemas';
import { CHECKOUT_STEPPER_TOKENS } from '@/lib/design-tokens';

interface CheckoutStatusStepperProps {
  currentStatus: CheckoutStatus;
  checkoutType: 'calibration' | 'repair' | 'rental';
}

/**
 * 반출 유형별 상태 단계 정의
 *
 * 교정/수리: 5단계
 * - pending → approved → checked_out → returned → return_approved
 *
 * 대여: 7단계 (양측 4단계 확인)
 * - pending → approved → lender_checked → borrower_received
 * → borrower_returned → lender_received → return_approved
 */
const STEP_STATUSES: Record<string, CheckoutStatus[]> = {
  calibration: ['pending', 'approved', 'checked_out', 'returned', 'return_approved'],
  repair: ['pending', 'approved', 'checked_out', 'returned', 'return_approved'],
  rental: [
    'pending',
    'approved',
    'lender_checked',
    'borrower_received',
    'borrower_returned',
    'lender_received',
    'return_approved',
  ],
};

/** status → stepper i18n key mapping */
const STEPPER_LABEL_MAP: Record<string, string> = {
  pending: 'pendingApproval',
  approved: 'approved',
  checked_out: 'checkedOut',
  returned: 'returned',
  return_approved: 'returnApproved',
  lender_checked: 'lenderCheckout',
  borrower_received: 'borrowerReceive',
  borrower_returned: 'borrowerReturn',
  lender_received: 'lenderReturn',
};

/**
 * 특수 상태 (진행 흐름에서 벗어난 상태)
 */
const SPECIAL_STATUSES: CheckoutStatus[] = ['rejected', 'canceled', 'overdue'];

/**
 * 반출 상태 진행 표시기
 *
 * 반출 유형(교정/수리/대여)에 따라 다른 단계를 표시합니다.
 * - 교정/수리: 5단계 (단순 흐름)
 * - 대여: 8단계 (양측 확인 포함)
 *
 * 접근성:
 * - aria-current="step"으로 현재 단계 표시
 * - role="group"으로 단계 그룹 표시
 */
export default function CheckoutStatusStepper({
  currentStatus,
  checkoutType,
}: CheckoutStatusStepperProps) {
  const t = useTranslations('checkouts');
  const steps = STEP_STATUSES[checkoutType] || STEP_STATUSES.calibration;
  const currentIndex = steps.indexOf(currentStatus);
  const isSpecialStatus = SPECIAL_STATUSES.includes(currentStatus);

  const getStepLabel = (status: CheckoutStatus) =>
    t(`stepper.${STEPPER_LABEL_MAP[status] || status}`);

  // 특수 상태인 경우 별도 표시
  if (isSpecialStatus) {
    const specialConfig =
      CHECKOUT_STEPPER_TOKENS.special[
        currentStatus as keyof typeof CHECKOUT_STEPPER_TOKENS.special
      ];

    return (
      <div className="flex flex-col items-center justify-center p-6" role="status">
        <div className={cn('p-4 rounded-full', specialConfig.container)}>
          {currentStatus === 'rejected' && (
            <XCircle className={cn(CHECKOUT_STEPPER_TOKENS.icon.special, specialConfig.icon)} />
          )}
          {currentStatus === 'canceled' && (
            <XCircle className={cn(CHECKOUT_STEPPER_TOKENS.icon.special, specialConfig.icon)} />
          )}
          {currentStatus === 'overdue' && (
            <Clock className={cn(CHECKOUT_STEPPER_TOKENS.icon.special, specialConfig.icon)} />
          )}
        </div>
        <p className={cn('mt-3 text-lg font-medium', specialConfig.label)}>
          {t(`status.${currentStatus}`)}
        </p>
        {currentStatus === 'overdue' && (
          <p className="text-sm text-muted-foreground mt-1">{t('stepper.overdueMessage')}</p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full" role="group" aria-label={t('stepper.ariaLabel')}>
      {/* 모바일: 세로 레이아웃 */}
      <div className="md:hidden space-y-4">
        {steps.map((status, index) => {
          const isCompleted = currentIndex > index;
          const isCurrent = currentIndex === index;
          const isPending = currentIndex < index;

          return (
            <div
              key={status}
              className="flex items-center gap-3"
              aria-current={isCurrent ? 'step' : undefined}
            >
              {/* 아이콘 */}
              <div
                className={cn(
                  'flex-shrink-0 rounded-full flex items-center justify-center',
                  CHECKOUT_STEPPER_TOKENS.node.mobile,
                  isCompleted && CHECKOUT_STEPPER_TOKENS.status.completed.node,
                  isCurrent && CHECKOUT_STEPPER_TOKENS.status.current.node,
                  isPending && CHECKOUT_STEPPER_TOKENS.status.pending.node
                )}
              >
                {isCompleted && (
                  <CheckCircle2
                    className={cn(
                      CHECKOUT_STEPPER_TOKENS.icon.mobile,
                      CHECKOUT_STEPPER_TOKENS.status.completed.icon
                    )}
                  />
                )}
                {isCurrent && (
                  <Circle
                    className={cn(
                      CHECKOUT_STEPPER_TOKENS.icon.mobile,
                      CHECKOUT_STEPPER_TOKENS.status.current.icon
                    )}
                  />
                )}
                {isPending && (
                  <Circle
                    className={cn(
                      CHECKOUT_STEPPER_TOKENS.icon.mobile,
                      CHECKOUT_STEPPER_TOKENS.status.pending.icon
                    )}
                  />
                )}
              </div>

              {/* 레이블 */}
              <span
                className={cn(
                  CHECKOUT_STEPPER_TOKENS.label.mobile,
                  isCompleted && CHECKOUT_STEPPER_TOKENS.status.completed.label,
                  isCurrent && CHECKOUT_STEPPER_TOKENS.status.current.label,
                  isPending && CHECKOUT_STEPPER_TOKENS.status.pending.label
                )}
              >
                {getStepLabel(status)}
              </span>
            </div>
          );
        })}
      </div>

      {/* 데스크톱: 가로 레이아웃 */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((status, index) => {
          const isCompleted = currentIndex > index;
          const isCurrent = currentIndex === index;
          const isPending = currentIndex < index;
          const isLast = index === steps.length - 1;

          return (
            <div
              key={status}
              className="flex items-center flex-1"
              aria-current={isCurrent ? 'step' : undefined}
            >
              {/* 단계 */}
              <div className="flex flex-col items-center">
                {/* 아이콘 */}
                <div
                  className={cn(
                    'rounded-full flex items-center justify-center',
                    CHECKOUT_STEPPER_TOKENS.node.desktop,
                    isCompleted && CHECKOUT_STEPPER_TOKENS.status.completed.node,
                    isCurrent && CHECKOUT_STEPPER_TOKENS.status.current.node,
                    isPending && CHECKOUT_STEPPER_TOKENS.status.pending.node
                  )}
                >
                  {isCompleted && (
                    <CheckCircle2
                      className={cn(
                        CHECKOUT_STEPPER_TOKENS.icon.desktop,
                        CHECKOUT_STEPPER_TOKENS.status.completed.icon
                      )}
                    />
                  )}
                  {isCurrent && (
                    <Circle
                      className={cn(
                        CHECKOUT_STEPPER_TOKENS.icon.desktop,
                        CHECKOUT_STEPPER_TOKENS.status.current.icon
                      )}
                    />
                  )}
                  {isPending && (
                    <Circle
                      className={cn(
                        CHECKOUT_STEPPER_TOKENS.icon.desktop,
                        CHECKOUT_STEPPER_TOKENS.status.pending.icon
                      )}
                    />
                  )}
                </div>

                {/* 레이블 */}
                <span
                  className={cn(
                    'mt-2 text-center max-w-[80px]',
                    CHECKOUT_STEPPER_TOKENS.label.desktop,
                    isCompleted && CHECKOUT_STEPPER_TOKENS.status.completed.label,
                    isCurrent && CHECKOUT_STEPPER_TOKENS.status.current.label,
                    isPending && CHECKOUT_STEPPER_TOKENS.status.pending.label
                  )}
                >
                  {getStepLabel(status)}
                </span>
              </div>

              {/* 연결선 */}
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2',
                    isCompleted
                      ? CHECKOUT_STEPPER_TOKENS.connector.completed
                      : CHECKOUT_STEPPER_TOKENS.connector.pending
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
