'use client';

import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { NextStepDescriptor } from '@equipment-management/schemas';

import { cn } from '@/lib/utils';
import { WORKFLOW_PANEL_TOKENS } from '@/lib/design-tokens';

interface NextStepPanelProps {
  descriptor: NextStepDescriptor;
  checkoutId: string;
  onAction?: (action: NonNullable<NextStepDescriptor['nextAction']>) => void | Promise<void>;
  className?: string;
}

export function NextStepPanel({ descriptor, checkoutId, onAction, className }: NextStepPanelProps) {
  const t = useTranslations('checkouts.fsm');
  const urgency = descriptor.urgency;

  if (descriptor.nextAction === null) {
    return (
      <section
        role="status"
        aria-label={t('panelTitle')}
        className={cn(WORKFLOW_PANEL_TOKENS.container.base, className)}
        data-checkout-id={checkoutId}
        data-urgency={urgency}
        data-next-action="none"
      >
        <div className={WORKFLOW_PANEL_TOKENS.terminal}>
          <CheckCircle2 className="inline h-5 w-5 text-brand-ok mr-1" aria-hidden="true" />
          {t('hint.terminal')}
        </div>
      </section>
    );
  }

  return (
    <section
      role="region"
      aria-label={t('panelTitle')}
      aria-live={urgency === 'critical' ? 'assertive' : 'polite'}
      className={cn(
        WORKFLOW_PANEL_TOKENS.container.base,
        WORKFLOW_PANEL_TOKENS.container.urgency[urgency],
        className
      )}
      data-checkout-id={checkoutId}
      data-urgency={urgency}
      data-next-action={descriptor.nextAction}
    >
      <header className={WORKFLOW_PANEL_TOKENS.header}>
        <h3 className={WORKFLOW_PANEL_TOKENS.title}>
          <span className={WORKFLOW_PANEL_TOKENS.urgencyDot[urgency]} aria-hidden="true" />
          {t('panelTitle')}
        </h3>
        <span className={WORKFLOW_PANEL_TOKENS.actor}>{t(`actor.${descriptor.nextActor}`)}</span>
      </header>

      <p className={WORKFLOW_PANEL_TOKENS.hint}>{t(`hint.${descriptor.hintKey}`)}</p>

      {descriptor.availableToCurrentUser ? (
        <button
          type="button"
          className={WORKFLOW_PANEL_TOKENS.action.primary}
          onClick={() => onAction?.(descriptor.nextAction!)}
          data-testid="next-step-action"
        >
          {t(`action.${descriptor.labelKey}`)}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : (
        <>
          <button
            type="button"
            disabled
            className={WORKFLOW_PANEL_TOKENS.action.blocked}
            aria-disabled="true"
            data-testid="next-step-action"
          >
            {t(`action.${descriptor.labelKey}`)}
          </button>
          {descriptor.blockingReason && (
            <p className={WORKFLOW_PANEL_TOKENS.blockedReason}>
              {t(`blocked.${descriptor.blockingReason}`)}
            </p>
          )}
        </>
      )}
    </section>
  );
}
