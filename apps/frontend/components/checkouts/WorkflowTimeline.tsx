'use client';

import React, { useState } from 'react';
import { Check, Dot, ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  CHECKOUT_DISPLAY_STEPS,
  CHECKOUT_TIMELINE_TOKENS,
  CHECKOUT_STEP_LABELS,
  CHECKOUT_RENTAL_PHASE_TOKENS,
  getPhaseCardState,
  type CheckoutTimelineNodeState,
} from '@/lib/design-tokens';
import {
  computeStepIndex,
  CheckoutStatusValues as CSVal,
  CheckoutPurposeValues as CPVal,
  RENTAL_PHASES,
  RENTAL_PHASE_I18N_KEY,
  RENTAL_STATUS_TO_PHASE,
  getPhaseIndex,
  type CheckoutStatus,
  type CheckoutPurpose,
  type RentalPhase,
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
                    tabIndex={0}
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

// ============================================================================
// Rental Phase Card (WorkflowTimeline phase-collapsible 모드)
// ============================================================================

interface RentalPhaseTimelineProps {
  status: CheckoutStatus;
  className?: string;
}

function RentalPhaseTimeline({ status, className }: RentalPhaseTimelineProps) {
  const t = useTranslations('checkouts');
  const currentPhaseIndex = getPhaseIndex(status, CPVal.RENTAL);

  const [expandedPhases, setExpandedPhases] = useState<Set<RentalPhase>>(() => {
    const set = new Set<RentalPhase>();
    if (currentPhaseIndex !== null) {
      set.add(RENTAL_PHASES[currentPhaseIndex]);
    }
    return set;
  });
  const [showAllExpanded, setShowAllExpanded] = useState(false);

  const togglePhase = (phase: RentalPhase) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) {
        next.delete(phase);
      } else {
        next.add(phase);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (showAllExpanded) {
      const set = new Set<RentalPhase>();
      if (currentPhaseIndex !== null) set.add(RENTAL_PHASES[currentPhaseIndex]);
      setExpandedPhases(set);
      setShowAllExpanded(false);
    } else {
      setExpandedPhases(new Set(RENTAL_PHASES));
      setShowAllExpanded(true);
    }
  };

  const phaseStepMap: Record<RentalPhase, CheckoutStatus[]> = {
    approve: CHECKOUT_DISPLAY_STEPS.rental.filter(
      (s) => RENTAL_STATUS_TO_PHASE[s as keyof typeof RENTAL_STATUS_TO_PHASE] === 'approve'
    ),
    handover: CHECKOUT_DISPLAY_STEPS.rental.filter(
      (s) => RENTAL_STATUS_TO_PHASE[s as keyof typeof RENTAL_STATUS_TO_PHASE] === 'handover'
    ),
    return: CHECKOUT_DISPLAY_STEPS.rental.filter(
      (s) => RENTAL_STATUS_TO_PHASE[s as keyof typeof RENTAL_STATUS_TO_PHASE] === 'return'
    ),
  };

  const currentStepIdx = computeStepIndex(status, CPVal.RENTAL);
  const isTerminalNegative = (TERMINAL_NEGATIVE as CheckoutStatus[]).includes(status);
  const isTerminalPositive = status === CSVal.RETURN_APPROVED;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={toggleAll}
          className={CHECKOUT_RENTAL_PHASE_TOKENS.expandAllBtn}
        >
          {showAllExpanded ? t('rentalPhase.collapseAll') : t('rentalPhase.expandAll')}
        </button>
      </div>

      {RENTAL_PHASES.map((phase, phaseIdx) => {
        const cardState = getPhaseCardState(phase, currentPhaseIndex, RENTAL_PHASES);
        const isExpanded = expandedPhases.has(phase);
        const steps = phaseStepMap[phase];
        const headerId = `phase-header-${phase}`;
        const contentId = `phase-content-${phase}`;
        const phaseI18nKey = RENTAL_PHASE_I18N_KEY[phase] as Parameters<typeof t>[0];

        return (
          <div
            key={phase}
            className={cn(
              CHECKOUT_RENTAL_PHASE_TOKENS.phaseCard.base,
              CHECKOUT_RENTAL_PHASE_TOKENS.phaseCard[cardState]
            )}
          >
            <button
              type="button"
              id={headerId}
              aria-expanded={isExpanded}
              aria-controls={contentId}
              onClick={() => togglePhase(phase)}
              className={cn(
                CHECKOUT_RENTAL_PHASE_TOKENS.phaseCardHeader.base,
                CHECKOUT_RENTAL_PHASE_TOKENS.phaseCardHeader[cardState]
              )}
            >
              <span className="flex items-center gap-2">
                {cardState === 'complete' ? (
                  <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                ) : cardState === 'current' ? (
                  <Dot className="h-4 w-4 shrink-0" aria-hidden="true" />
                ) : (
                  <span className="h-4 w-4 shrink-0" aria-hidden="true" />
                )}
                <span>
                  {phaseIdx + 1}/3 · {t(phaseI18nKey)}
                </span>
              </span>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
            </button>

            {isExpanded && (
              <div id={contentId} role="region" aria-labelledby={headerId}>
                <div className={CHECKOUT_RENTAL_PHASE_TOKENS.phaseCardContent}>
                  {cardState === 'future' ? (
                    <p className={CHECKOUT_RENTAL_PHASE_TOKENS.collapsedSummary}>
                      {t('rentalPhase.waiting', { n: steps.length })}
                    </p>
                  ) : (
                    <TooltipProvider>
                      <div role="list" className={CHECKOUT_TIMELINE_TOKENS.container}>
                        {steps.map((stepStatus, index) => {
                          const globalStepNum =
                            CHECKOUT_DISPLAY_STEPS.rental.indexOf(stepStatus) + 1;
                          const nodeState = deriveNodeState(
                            globalStepNum,
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
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    tabIndex={0}
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
                                  <p className="font-medium text-xs">
                                    {t(`help.status.${stepStatus}.title`)}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {t(`help.status.${stepStatus}.description`)}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                              <span
                                className={cn(
                                  'block mt-1.5',
                                  CHECKOUT_TIMELINE_TOKENS.label[nodeState]
                                )}
                              >
                                {labelKey ? t(`stepper.${labelKey}`) : stepStatus}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function WorkflowTimeline({ status, purpose, className }: WorkflowTimelineProps) {
  if (purpose === CPVal.RENTAL) {
    return <RentalPhaseTimeline status={status} className={className} />;
  }
  return <WorkflowTimelineInner status={status} purpose={purpose} className={className} />;
}
