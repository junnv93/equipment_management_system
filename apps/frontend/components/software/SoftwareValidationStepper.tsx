'use client';

import { memo } from 'react';
import { Check, X } from 'lucide-react';
import { useTranslations, useFormatter } from 'next-intl';

import { cn } from '@/lib/utils';
import {
  type SoftwareValidationStepDescriptor,
  type ProgressStepState,
} from '@equipment-management/schemas';

// ============================================================================
// 시각 토큰 — CheckoutProgressStepper 패턴 추종 (brand 토큰 + alpha utility 사용)
// ============================================================================
//
// dark: prefix 금지 — :root/.dark CSS 변수 자동 전환.
// motion-safe: prefix로 reduced-motion 사용자 보호.

const STEP_CIRCLE_BASE =
  'relative grid place-items-center w-7 h-7 rounded-full border-2 ' +
  'text-xs font-bold leading-none flex-shrink-0 z-[2] bg-card transition-colors duration-150';

const STEP_CIRCLE_BY_STATE: Record<ProgressStepState, string> = {
  done: 'bg-brand-ok text-white border-brand-ok',
  current:
    'bg-brand-info text-white border-brand-info ' +
    'shadow-[0_0_0_4px_hsl(var(--brand-color-info)/0.18)]',
  late:
    'bg-brand-critical text-white border-brand-critical ' +
    'shadow-[0_0_0_4px_hsl(var(--brand-color-critical)/0.18)] motion-safe:animate-pulse',
  future: 'bg-card text-muted-foreground border-brand-border-strong',
  terminated: 'bg-brand-critical/10 text-brand-critical border-brand-critical opacity-90',
};

const STEP_LABEL_BY_STATE: Record<ProgressStepState, string> = {
  done: 'text-muted-foreground font-semibold',
  current: 'text-brand-info font-bold',
  late: 'text-brand-critical font-bold',
  future: 'text-foreground font-semibold',
  terminated: 'text-brand-critical font-semibold',
};

const CONNECTOR_BY_STATE: Record<'done' | 'pending', string> = {
  done: 'bg-brand-ok',
  pending: 'bg-brand-border-strong',
};

// ============================================================================
// Props
// ============================================================================

export interface SoftwareValidationStepperProps {
  /** adapter hook(`use-software-validation-progress-steps`)이 도출한 step 배열 */
  readonly steps: readonly SoftwareValidationStepDescriptor[];
  /** 추가 className */
  readonly className?: string;
}

// ============================================================================
// 보조 컴포넌트 — 단일 step 노드
// ============================================================================

const StepNode = memo(function StepNode({
  step,
  isLast,
  ariaCurrent,
}: {
  step: SoftwareValidationStepDescriptor;
  isLast: boolean;
  ariaCurrent: boolean;
}) {
  const t = useTranslations('software');
  const format = useFormatter();
  const { state, labelKey, actor, timestamp, index } = step;

  const circleContent = (() => {
    if (state === 'done') return <Check className="h-3.5 w-3.5" aria-hidden />;
    if (state === 'terminated') return <X className="h-3.5 w-3.5" aria-hidden />;
    return <span aria-hidden>{index + 1}</span>;
  })();

  // sr-only 상태 텍스트 — 색상으로만 단계 의미 전달 회피 (WCAG)
  const srState = (() => {
    if (state === 'current') return ''; // aria-current="step"이 발화
    if (state === 'done') return t('validation.steps.stateDone');
    if (state === 'terminated') return t('validation.steps.stateTerminated');
    return t('validation.steps.stateFuture');
  })();

  // 메타 라인 — done 단계는 actor + timestamp, current/future는 "대기 중"
  const metaLine = (() => {
    if (timestamp && state !== 'future') {
      const date = new Date(timestamp);
      const formatted = format.dateTime(date, {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      return (
        <span className="block">
          {formatted}
          {actor ? (
            <>
              <br />
              <b className="font-semibold text-foreground">{actor}</b>
            </>
          ) : null}
        </span>
      );
    }
    if (state === 'current' || state === 'late') {
      return <span className="block">{t('validation.steps.pending')}</span>;
    }
    return null;
  })();

  return (
    <li
      className="relative flex min-w-0 flex-col items-center px-1.5 text-center"
      aria-current={ariaCurrent ? 'step' : undefined}
    >
      <div className={cn(STEP_CIRCLE_BASE, STEP_CIRCLE_BY_STATE[state])}>
        {circleContent}
        {srState && <span className="sr-only">{srState}</span>}
      </div>

      {!isLast && (
        <div
          className={cn(
            'absolute top-3.5 left-[calc(50%+18px)] right-[calc(-50%+18px)] z-[1] h-0.5',
            state === 'done' ? CONNECTOR_BY_STATE.done : CONNECTOR_BY_STATE.pending
          )}
          aria-hidden
        />
      )}

      <span className={cn('mt-2 max-w-[14ch] text-xs leading-snug', STEP_LABEL_BY_STATE[state])}>
        {/* labelKey 형식: 'validation.steps.{key}' */}
        {t(labelKey as never)}
      </span>

      {metaLine ? (
        <span className="mt-1 font-mono text-[11px] leading-snug text-muted-foreground">
          {metaLine}
        </span>
      ) : null}
    </li>
  );
});

// ============================================================================
// 메인 컴포넌트
// ============================================================================

/**
 * 소프트웨어 유효성 확인 승인 진행 stepper.
 *
 * **DESIGN_REVIEW.md P0-1 해결**: 4단계(submitted → approved → quality_approved + rejected 분기)를
 * 텍스트 타임스탬프 대신 시각적 stepper로 표현. 페이지 진입 즉시 "현재 어디" 파악 가능.
 *
 * **데이터 흐름**:
 *   1. `useSoftwareValidationProgressSteps()` 가 SoftwareValidation → SoftwareValidationStepDescriptor[]
 *   2. 본 컴포넌트는 prop 으로만 받아 시각 변환 (presentational)
 *
 * **a11y**:
 *   - `<ol role="list">` 시맨틱 + `aria-label`(i18n)
 *   - 각 `<li>` `aria-current="step"` (current/late만)
 *   - 원 안의 ✓/숫자/X에 sr-only 상태 텍스트 동반 (색상 단독 의미 전달 회피)
 *   - `motion-safe:animate-pulse` — reduced-motion 사용자 보호
 *
 * **반응형**: `style={{ gridTemplateColumns: 'repeat(N, minmax(0, 1fr))' }}` 동적 N 컬럼 (Tailwind JIT 안전).
 */
function SoftwareValidationStepper({ steps, className }: SoftwareValidationStepperProps) {
  const t = useTranslations('software');
  if (steps.length === 0) return null;

  return (
    <ol
      role="list"
      aria-label={t('validation.steps.ariaLabel')}
      className={cn('relative grid gap-0 rounded-lg border bg-card px-2 pt-2 pb-2.5', className)}
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
    >
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const ariaCurrent = step.state === 'current' || step.state === 'late';
        return (
          <StepNode
            key={`${step.key}-${step.index}`}
            step={step}
            isLast={isLast}
            ariaCurrent={ariaCurrent}
          />
        );
      })}
    </ol>
  );
}

export default memo(SoftwareValidationStepper);
