/**
 * StepperHeader — Rental 4-step 진행 상태 시각화 (qr-visual-redesign TASK 5 / 2026-05-11).
 *
 * 4 단계 (lender_checkout → borrower_receive → borrower_return → lender_return) 의
 * 현재 위치를 항상 상단에 표시. 사용자가 폼 안에서 자신이 어디 있는지 한눈에 인지.
 *
 * 1차 텍스트 ≥ 14px (mobile), 색은 brand-ok / brand-mute SSOT 사용 — text-muted-foreground 금지.
 *
 * @see packages/schemas/src/enums/return-condition.ts (CONDITION_CHECK_STEP_VALUES SSOT)
 * @see checkouts.condition.stepLabels.{step} i18n
 */
'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import {
  CONDITION_CHECK_STEP_VALUES,
  type ConditionCheckStep,
} from '@equipment-management/schemas';
import { cn } from '@/lib/utils';

export interface StepperHeaderProps {
  /** 현재 활성 단계 */
  step: ConditionCheckStep;
  className?: string;
}

export function StepperHeader({ step, className }: StepperHeaderProps) {
  const t = useTranslations('checkouts.condition.stepLabels');
  const activeIndex = CONDITION_CHECK_STEP_VALUES.indexOf(step);

  return (
    <ol
      aria-label={t('groupAriaLabel')}
      className={cn('flex w-full items-stretch gap-1.5', className)}
    >
      {CONDITION_CHECK_STEP_VALUES.map((s, idx) => {
        const isCompleted = idx < activeIndex;
        const isActive = idx === activeIndex;
        const label = t(s);
        return (
          <li
            key={s}
            aria-current={isActive ? 'step' : undefined}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 rounded-md border px-2 py-1.5 text-center',
              isActive
                ? 'border-brand-ok bg-brand-ok/10'
                : isCompleted
                  ? 'border-brand-ok/40 bg-brand-ok/5'
                  : 'border-border bg-card'
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full font-mono tabular-nums text-[10px] font-semibold',
                isActive
                  ? 'bg-brand-ok text-white'
                  : isCompleted
                    ? 'bg-brand-ok/70 text-white'
                    : 'bg-muted text-foreground/60'
              )}
            >
              {isCompleted ? <Check className="h-3 w-3" aria-hidden="true" /> : idx + 1}
            </span>
            <span
              className={cn(
                'text-[11px] font-medium leading-tight label-ko md:text-xs',
                isActive ? 'text-brand-ok' : isCompleted ? 'text-foreground' : 'text-foreground/70'
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
