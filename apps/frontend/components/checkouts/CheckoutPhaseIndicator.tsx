'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { CHECKOUT_RENTAL_PHASE_TOKENS } from '@/lib/design-tokens';
import {
  RENTAL_PHASES,
  RENTAL_PHASE_I18N_KEY,
  type NextStepDescriptor,
} from '@equipment-management/schemas';

interface CheckoutPhaseIndicatorProps {
  descriptor: NextStepDescriptor;
  variant?: 'inline' | 'compact';
  className?: string;
}

/**
 * Rental 반출의 Phase 진행 표시 (approve → handover → return).
 * descriptor.phase === null이면 null 렌더 (non-rental 자동 가드).
 */
export function CheckoutPhaseIndicator({
  descriptor,
  variant = 'compact',
  className,
}: CheckoutPhaseIndicatorProps) {
  const t = useTranslations('checkouts');

  if (descriptor.phase === null || descriptor.phaseIndex === null) return null;

  const currentPhaseIndex = descriptor.phaseIndex;
  const totalPhases = descriptor.totalPhases ?? 3;
  const phaseKey = descriptor.phase as keyof typeof RENTAL_PHASE_I18N_KEY;
  const currentPhaseLabel = t(RENTAL_PHASE_I18N_KEY[phaseKey] as Parameters<typeof t>[0]);

  return (
    <div
      role="group"
      aria-label={t('rentalPhase.ariaLabel', {
        current: currentPhaseIndex + 1,
        total: totalPhases,
      })}
      className={cn(
        variant === 'compact'
          ? CHECKOUT_RENTAL_PHASE_TOKENS.containerCompact
          : CHECKOUT_RENTAL_PHASE_TOKENS.containerInline,
        className
      )}
    >
      {/* Phase dot 3개 */}
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {RENTAL_PHASES.map((phase, idx) => {
          const state =
            idx < currentPhaseIndex ? 'complete' : idx === currentPhaseIndex ? 'current' : 'future';
          return (
            <span
              key={phase}
              className={cn(
                CHECKOUT_RENTAL_PHASE_TOKENS.dotBase,
                CHECKOUT_RENTAL_PHASE_TOKENS.dotState[state]
              )}
            />
          );
        })}
      </div>
      {/* 텍스트 라벨 */}
      <span
        className={
          variant === 'compact'
            ? CHECKOUT_RENTAL_PHASE_TOKENS.labelCompact
            : CHECKOUT_RENTAL_PHASE_TOKENS.label
        }
      >
        {currentPhaseIndex + 1}/{totalPhases} · {currentPhaseLabel}
      </span>
    </div>
  );
}
