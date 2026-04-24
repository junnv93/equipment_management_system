'use client';

import React, { Suspense } from 'react';
import { Check, Dot } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  CHECKOUT_DISPLAY_STEPS,
  CHECKOUT_TIMELINE_TOKENS,
  CHECKOUT_STEP_LABELS,
  type CheckoutTimelineNodeState,
} from '@/lib/design-tokens';
import {
  computeStepIndex,
  computeTotalSteps,
  CheckoutStatusValues as CSVal,
  type CheckoutStatus,
  type CheckoutPurpose,
} from '@equipment-management/schemas';

const TERMINAL_NEGATIVE: readonly CheckoutStatus[] = [CSVal.REJECTED, CSVal.CANCELED];

// ============================================================================
// Node state derivation (SSOT: computeStepIndex 기반)
// ============================================================================

function deriveNodeState(
  stepNum: number,
  currentStepIdx: number,
  isTerminalNegative: boolean,
  isTerminalPositive: boolean
): CheckoutTimelineNodeState {
  if (isTerminalPositive) return 'past';
  if (isTerminalNegative) {
    if (stepNum < currentStepIdx) return 'past';
    if (stepNum === currentStepIdx) return 'current';
    return 'skipped';
  }
  if (stepNum < currentStepIdx) return 'past';
  if (stepNum === currentStepIdx) return 'current';
  if (stepNum === currentStepIdx + 1) return 'next';
  return 'future';
}

// ============================================================================
// Skeleton
// ============================================================================

export function WorkflowTimelineSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className={CHECKOUT_TIMELINE_TOKENS.container} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={cn(CHECKOUT_TIMELINE_TOKENS.itemWrapper, i < count - 1 ? 'pb-4' : '')}
        >
          <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-muted motion-safe:animate-pulse" />
          {i < count - 1 && (
            <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-muted motion-safe:animate-pulse" />
          )}
          <div className="h-4 bg-muted rounded motion-safe:animate-pulse w-24 mt-1.5" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// WorkflowTimeline
// ============================================================================

interface WorkflowTimelineProps {
  status: CheckoutStatus;
  purpose: CheckoutPurpose;
  className?: string;
}

function WorkflowTimelineInner({ status, purpose, className }: WorkflowTimelineProps) {
  const t = useTranslations('checkouts');

  const steps =
    purpose === 'rental' ? CHECKOUT_DISPLAY_STEPS.rental : CHECKOUT_DISPLAY_STEPS.nonRental;
  const currentStepIdx = computeStepIndex(status, purpose);
  const isTerminalNegative = (TERMINAL_NEGATIVE as CheckoutStatus[]).includes(status);
  const isTerminalPositive = status === CSVal.RETURN_APPROVED;

  return (
    <TooltipProvider>
      <div
        data-testid="workflow-timeline"
        role="list"
        aria-label={t('stepper.ariaLabel')}
        className={cn(CHECKOUT_TIMELINE_TOKENS.container, className)}
      >
        {steps.map((stepStatus, index) => {
          const stepNum = index + 1;
          const nodeState = deriveNodeState(
            stepNum,
            currentStepIdx,
            isTerminalNegative,
            isTerminalPositive
          );
          const isLast = index === steps.length - 1;
          const labelKey = CHECKOUT_STEP_LABELS[stepStatus];

          return (
            <div
              key={stepStatus}
              role="listitem"
              className={cn(
                CHECKOUT_TIMELINE_TOKENS.itemWrapper,
                CHECKOUT_TIMELINE_TOKENS.node[nodeState],
                isLast ? 'pb-2' : 'pb-4'
              )}
            >
              {/* 세로 연결선 (마지막 노드 제외) */}
              {!isLast && (
                <div
                  className={cn(
                    CHECKOUT_TIMELINE_TOKENS.connector.base,
                    nodeState === 'past'
                      ? CHECKOUT_TIMELINE_TOKENS.connector.past
                      : CHECKOUT_TIMELINE_TOKENS.connector.future
                  )}
                  aria-hidden="true"
                />
              )}

              {/* 도트 + Tooltip */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'absolute left-0 top-0',
                      CHECKOUT_TIMELINE_TOKENS.dot.base,
                      CHECKOUT_TIMELINE_TOKENS.dot[nodeState]
                    )}
                    data-step-state={nodeState}
                    aria-current={nodeState === 'current' ? 'step' : undefined}
                    aria-label={labelKey ? t(`stepper.${labelKey}`) : stepStatus}
                  >
                    {nodeState === 'past' ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Dot className="h-4 w-4" aria-hidden="true" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[200px]">
                  <p className="font-medium text-xs">{t(`help.status.${stepStatus}.title`)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t(`help.status.${stepStatus}.description`)}
                  </p>
                </TooltipContent>
              </Tooltip>

              {/* 스텝 라벨 */}
              <span className={cn('block mt-1.5', CHECKOUT_TIMELINE_TOKENS.label[nodeState])}>
                {labelKey ? t(`stepper.${labelKey}`) : stepStatus}
              </span>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

export function WorkflowTimeline(props: WorkflowTimelineProps) {
  const stepCount = computeTotalSteps(props.purpose);
  return (
    <Suspense fallback={<WorkflowTimelineSkeleton count={stepCount} />}>
      <WorkflowTimelineInner {...props} />
    </Suspense>
  );
}
