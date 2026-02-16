'use client';

import { Check, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UnifiedApprovalStatus, ApprovalHistoryEntry } from '@/lib/api/approvals-api';

interface ApprovalStepIndicatorProps {
  type: 'disposal' | 'calibration_plan';
  currentStatus: UnifiedApprovalStatus;
  history?: ApprovalHistoryEntry[];
}

interface Step {
  key: string;
  label: string;
  role: string;
}

// 폐기: 2단계
const disposalSteps: Step[] = [
  { key: 'pending_review', label: '요청', role: '시험실무자' },
  { key: 'reviewed', label: '검토', role: '기술책임자' },
  { key: 'approved', label: '승인', role: '시험소장' },
];

// 교정계획서: 3단계
const planSteps: Step[] = [
  { key: 'pending_review', label: '작성', role: '기술책임자' },
  { key: 'reviewed', label: '검토', role: '품질책임자' },
  { key: 'approved', label: '승인', role: '시험소장' },
];

const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  pending_review: 1,
  reviewed: 2,
  approved: 3,
  rejected: -1,
};

export function ApprovalStepIndicator({
  type,
  currentStatus,
  history,
}: ApprovalStepIndicatorProps) {
  const steps = type === 'disposal' ? disposalSteps : planSteps;
  const currentOrder = STATUS_ORDER[currentStatus] ?? 0;
  const isRejected = currentStatus === 'rejected';

  // 각 단계에 해당하는 이력 찾기
  const getHistoryForStep = (stepIndex: number): ApprovalHistoryEntry | undefined => {
    return history?.find((h) => h.step === stepIndex + 1);
  };

  return (
    <div
      className="flex items-center gap-2 py-3"
      role="group"
      aria-label="승인 진행 상태"
      data-testid="step-indicator"
    >
      {steps.map((step, index) => {
        const stepOrder = index + 1;
        const isCompleted = !isRejected && currentOrder >= stepOrder;
        const isCurrent = currentOrder === stepOrder && !isRejected;
        const historyEntry = getHistoryForStep(index);

        return (
          <div key={step.key} className="flex items-center">
            {/* 단계 아이콘 */}
            <div
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors',
                isRejected && isCurrent
                  ? 'border-ul-red bg-ul-red text-white'
                  : isCompleted
                    ? 'border-ul-green bg-ul-green text-white'
                    : isCurrent
                      ? 'border-ul-blue bg-ul-blue text-white'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400'
              )}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {isRejected && isCurrent ? (
                <XCircle className="h-4 w-4" />
              ) : isCompleted ? (
                <Check className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
            </div>

            {/* 단계 정보 */}
            <div className="ml-2 min-w-[80px]">
              <p
                className={cn(
                  'text-sm font-medium',
                  isCurrent ? 'text-[#0067B1]' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </p>
              <p className="text-xs text-muted-foreground">{step.role}</p>
              {historyEntry && (
                <p className="text-xs text-muted-foreground/70 truncate max-w-[100px]">
                  {historyEntry.actorName}
                </p>
              )}
            </div>

            {/* 연결선 */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-8 h-0.5 mx-2',
                  currentOrder > stepOrder ? 'bg-ul-green' : 'bg-gray-200 dark:bg-gray-700'
                )}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
