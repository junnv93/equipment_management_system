'use client';

import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CheckoutStatus, CHECKOUT_STATUS_LABELS } from '@equipment-management/schemas';

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
 * 대여: 8단계 (양측 4단계 확인)
 * - pending → approved → lender_checked → borrower_received
 * → in_use → borrower_returned → lender_received → return_approved
 */
const STEPS_BY_TYPE: Record<string, { status: CheckoutStatus; label: string }[]> = {
  calibration: [
    { status: 'pending', label: '승인 대기' },
    { status: 'approved', label: '승인됨' },
    { status: 'checked_out', label: '반출 중' },
    { status: 'returned', label: '반입 완료' },
    { status: 'return_approved', label: '반입 승인' },
  ],
  repair: [
    { status: 'pending', label: '승인 대기' },
    { status: 'approved', label: '승인됨' },
    { status: 'checked_out', label: '반출 중' },
    { status: 'returned', label: '반입 완료' },
    { status: 'return_approved', label: '반입 승인' },
  ],
  rental: [
    { status: 'pending', label: '승인 대기' },
    { status: 'approved', label: '승인됨' },
    { status: 'lender_checked', label: '반출 확인' },
    { status: 'borrower_received', label: '인수 확인' },
    { status: 'in_use', label: '사용 중' },
    { status: 'borrower_returned', label: '반납 확인' },
    { status: 'lender_received', label: '반입 확인' },
    { status: 'return_approved', label: '반입 승인' },
  ],
};

/**
 * 특수 상태 (진행 흐름에서 벗어난 상태)
 */
const SPECIAL_STATUSES: CheckoutStatus[] = ['rejected', 'canceled', 'overdue'];

/**
 * 현재 상태의 단계 인덱스 찾기
 */
function getStepIndex(steps: { status: CheckoutStatus }[], status: CheckoutStatus): number {
  return steps.findIndex((step) => step.status === status);
}

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
  const steps = STEPS_BY_TYPE[checkoutType] || STEPS_BY_TYPE.calibration;
  const currentIndex = getStepIndex(steps, currentStatus);
  const isSpecialStatus = SPECIAL_STATUSES.includes(currentStatus);

  // 특수 상태인 경우 별도 표시
  if (isSpecialStatus) {
    return (
      <div className="flex flex-col items-center justify-center p-6" role="status">
        <div
          className={cn(
            'p-4 rounded-full',
            currentStatus === 'rejected' && 'bg-red-100',
            currentStatus === 'canceled' && 'bg-gray-100',
            currentStatus === 'overdue' && 'bg-orange-100'
          )}
        >
          {currentStatus === 'rejected' && <XCircle className="h-8 w-8 text-red-600" />}
          {currentStatus === 'canceled' && <XCircle className="h-8 w-8 text-gray-600" />}
          {currentStatus === 'overdue' && <Clock className="h-8 w-8 text-orange-600" />}
        </div>
        <p
          className={cn(
            'mt-3 text-lg font-medium',
            currentStatus === 'rejected' && 'text-red-800',
            currentStatus === 'canceled' && 'text-gray-800',
            currentStatus === 'overdue' && 'text-orange-800'
          )}
        >
          {CHECKOUT_STATUS_LABELS[currentStatus] || currentStatus}
        </p>
        {currentStatus === 'overdue' && (
          <p className="text-sm text-muted-foreground mt-1">반입 예정일이 초과되었습니다.</p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full" role="group" aria-label="반출 진행 상태">
      {/* 모바일: 세로 레이아웃 */}
      <div className="md:hidden space-y-4">
        {steps.map((step, index) => {
          const isCompleted = currentIndex > index;
          const isCurrent = currentIndex === index;
          const isPending = currentIndex < index;

          return (
            <div
              key={step.status}
              className="flex items-center gap-3"
              aria-current={isCurrent ? 'step' : undefined}
            >
              {/* 아이콘 */}
              <div
                className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                  isCompleted && 'bg-green-100',
                  isCurrent && 'bg-blue-100',
                  isPending && 'bg-gray-100'
                )}
              >
                {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                {isCurrent && <Circle className="h-5 w-5 text-blue-600 fill-blue-600" />}
                {isPending && <Circle className="h-5 w-5 text-gray-400" />}
              </div>

              {/* 레이블 */}
              <span
                className={cn(
                  'text-sm',
                  isCompleted && 'text-green-800',
                  isCurrent && 'font-medium text-blue-800',
                  isPending && 'text-gray-500'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* 데스크톱: 가로 레이아웃 */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentIndex > index;
          const isCurrent = currentIndex === index;
          const isPending = currentIndex < index;
          const isLast = index === steps.length - 1;

          return (
            <div
              key={step.status}
              className="flex items-center flex-1"
              aria-current={isCurrent ? 'step' : undefined}
            >
              {/* 단계 */}
              <div className="flex flex-col items-center">
                {/* 아이콘 */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                    isCompleted && 'bg-green-100',
                    isCurrent && 'bg-blue-100 ring-2 ring-blue-500 ring-offset-2',
                    isPending && 'bg-gray-100'
                  )}
                >
                  {isCompleted && <CheckCircle2 className="h-6 w-6 text-green-600" />}
                  {isCurrent && <Circle className="h-6 w-6 text-blue-600 fill-blue-600" />}
                  {isPending && <Circle className="h-6 w-6 text-gray-400" />}
                </div>

                {/* 레이블 */}
                <span
                  className={cn(
                    'mt-2 text-xs text-center max-w-[80px]',
                    isCompleted && 'text-green-800',
                    isCurrent && 'font-medium text-blue-800',
                    isPending && 'text-gray-500'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* 연결선 */}
              {!isLast && (
                <div
                  className={cn('flex-1 h-0.5 mx-2', isCompleted ? 'bg-green-400' : 'bg-gray-200')}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
