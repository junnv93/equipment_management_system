'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { CheckoutAction, NextStepDescriptor } from '@equipment-management/schemas';

import { NEXT_STEP_PANEL_TOKENS, ANIMATION_PRESETS, REDUCED_MOTION } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

// ============================================================================
// Props
// ============================================================================

interface NextStepPanelProps {
  descriptor: NextStepDescriptor;
  variant?: 'floating' | 'inline' | 'compact';
  onActionClick?: (action: CheckoutAction) => void | Promise<void>;
  isPending?: boolean;
  className?: string;
  'data-testid'?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * 공용 NextStepPanel — FSM NextStepDescriptor를 렌더링.
 *
 * variant: floating(강조) / inline(그룹 카드 내) / compact(축약)
 * 접근성: role="status" aria-live="polite" aria-atomic="true"
 * 모션: key={descriptor.currentStatus} 로 전이 시 re-mount → ANIMATION_PRESETS.fadeIn
 *
 * @see components/checkouts/NextStepPanel.tsx — checkoutId 필수 버전 (수정 금지)
 */
export function NextStepPanel({
  descriptor,
  variant = 'inline',
  onActionClick,
  isPending = false,
  className,
  'data-testid': testId,
}: NextStepPanelProps) {
  const t = useTranslations('checkouts.fsm');
  const urgency = descriptor.urgency;

  const containerClasses = cn(
    NEXT_STEP_PANEL_TOKENS.container[variant],
    NEXT_STEP_PANEL_TOKENS.urgency[urgency],
    urgency === 'critical' && REDUCED_MOTION.safe(ANIMATION_PRESETS.pulseHard),
    ANIMATION_PRESETS.fadeIn,
    className
  );

  // ── Terminal state ─────────────────────────────────────────────────────────
  if (descriptor.nextAction === null) {
    return (
      <div
        key={descriptor.currentStatus}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={containerClasses}
        data-testid={testId}
      >
        <span className={NEXT_STEP_PANEL_TOKENS.terminal.badge}>
          <CheckCircle2
            className={cn(NEXT_STEP_PANEL_TOKENS.terminal.icon, 'text-brand-ok')}
            aria-hidden="true"
          />
          {t('hint.terminal')}
        </span>
      </div>
    );
  }

  // ── Active state ───────────────────────────────────────────────────────────
  const stepLabel = `${t(`action.${descriptor.labelKey}`)} — ${descriptor.currentStepIndex}/${descriptor.totalSteps}`;
  const canAct = descriptor.availableToCurrentUser;

  return (
    <div
      key={descriptor.currentStatus}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={containerClasses}
      data-testid={testId}
    >
      {/* Line 1: 현재 액션 — step 진행 */}
      <p className={NEXT_STEP_PANEL_TOKENS.labels.current}>{stepLabel}</p>

      {/* Line 2: 힌트 */}
      <p className={cn(NEXT_STEP_PANEL_TOKENS.labels.hint, 'mt-0.5')}>
        {t(`hint.${descriptor.hintKey}`)}
      </p>

      {/* Line 3: 행위자 */}
      <p className={cn(NEXT_STEP_PANEL_TOKENS.labels.actor, 'mt-0.5')}>
        {t(`actor.${descriptor.nextActor}`)}
      </p>

      {/* Action button */}
      {canAct ? (
        <button
          type="button"
          className={cn(NEXT_STEP_PANEL_TOKENS.actionButton.primary, 'mt-2')}
          aria-label={stepLabel}
          disabled={isPending}
          aria-disabled={isPending}
          onClick={() => onActionClick?.(descriptor.nextAction!)}
          data-testid={testId ? `${testId}-action` : undefined}
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
          {t(`action.${descriptor.labelKey}`)}
        </button>
      ) : (
        <p className={cn(NEXT_STEP_PANEL_TOKENS.labels.actor, 'mt-2 not-italic')}>
          {descriptor.nextActor !== 'none' && t(`actor.${descriptor.nextActor}`)}
        </p>
      )}
    </div>
  );
}
