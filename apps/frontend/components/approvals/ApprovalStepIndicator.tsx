'use client';

import { Check, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UnifiedApprovalStatus, ApprovalHistoryEntry } from '@/lib/api/approvals-api';
import {
  getApprovalStepperNodeClasses,
  APPROVAL_STEPPER_TOKENS,
  getTransitionClasses,
} from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';

interface ApprovalStepIndicatorProps {
  type: 'disposal' | 'calibration_plan';
  currentStatus: UnifiedApprovalStatus;
  history?: ApprovalHistoryEntry[];
}

interface Step {
  key: string;
  labelKey: string;
  roleKey: string;
}

// 폐기: 2단계
const disposalSteps: Step[] = [
  { key: 'pending_review', labelKey: 'steps.request', roleKey: 'steps.roles.test_engineer' },
  { key: 'reviewed', labelKey: 'steps.review', roleKey: 'steps.roles.technical_manager' },
  { key: 'approved', labelKey: 'steps.approve', roleKey: 'steps.roles.lab_manager' },
];

// 교정계획서: 3단계
const planSteps: Step[] = [
  { key: 'pending_review', labelKey: 'steps.draft', roleKey: 'steps.roles.technical_manager' },
  { key: 'reviewed', labelKey: 'steps.review', roleKey: 'steps.roles.quality_manager' },
  { key: 'approved', labelKey: 'steps.approve', roleKey: 'steps.roles.lab_manager' },
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
  const t = useTranslations('approvals');
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
      aria-label={t('steps.ariaLabel')}
      data-testid="step-indicator"
    >
      {steps.map((step, index) => {
        const stepOrder = index + 1;
        const isCompleted = !isRejected && currentOrder >= stepOrder;
        const isCurrent = currentOrder === stepOrder && !isRejected;
        const historyEntry = getHistoryForStep(index);

        const stepperStatus =
          isRejected && isCurrent
            ? 'rejected'
            : isCompleted
              ? 'completed'
              : isCurrent
                ? 'current'
                : 'pending';

        return (
          <div key={step.key} className="flex items-center">
            {/* 단계 아이콘 */}
            <div
              className={cn(
                getApprovalStepperNodeClasses(stepperStatus),
                getTransitionClasses('fast', ['border-color', 'background-color', 'color'])
              )}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {isRejected && isCurrent ? (
                <XCircle className={APPROVAL_STEPPER_TOKENS.icon} />
              ) : isCompleted ? (
                <Check className={APPROVAL_STEPPER_TOKENS.icon} />
              ) : (
                <Clock className={APPROVAL_STEPPER_TOKENS.icon} />
              )}
            </div>

            {/* 단계 정보 */}
            <div className={`ml-2 ${APPROVAL_STEPPER_TOKENS.infoWidth}`}>
              <p
                className={cn(
                  APPROVAL_STEPPER_TOKENS.label.base,
                  isCurrent
                    ? APPROVAL_STEPPER_TOKENS.label.current
                    : APPROVAL_STEPPER_TOKENS.label.inactive
                )}
              >
                {t(step.labelKey)}
              </p>
              <p className="text-xs text-muted-foreground">{t(step.roleKey)}</p>
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
                  APPROVAL_STEPPER_TOKENS.connector.base,
                  currentOrder > stepOrder
                    ? APPROVAL_STEPPER_TOKENS.connector.completed
                    : APPROVAL_STEPPER_TOKENS.connector.pending
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
