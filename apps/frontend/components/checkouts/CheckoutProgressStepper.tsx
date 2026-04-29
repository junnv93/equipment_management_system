'use client';

import { memo } from 'react';
import { Check, AlertTriangle, X } from 'lucide-react';
import { useTranslations, useFormatter } from 'next-intl';

import { cn } from '@/lib/utils';
import { type ProgressStepDescriptor, type ProgressStepState } from '@equipment-management/schemas';

// ============================================================================
// 컴포넌트 토큰 (와이어프레임 02 line 73-126 정확 복제 + design-tokens 참조)
// ============================================================================
//
// 전체 stepper 토큰을 본 컴포넌트 내부에 closure로 보관하지 않고 export const 로 노출 →
// 후속 verify-design-tokens / Storybook 에서 재사용 가능.
// 색상은 brand 토큰 + alpha utility 만 사용 (`dark:` prefix 금지 — :root/.dark 자동 전환).

const STEP_CIRCLE_BASE =
  'relative grid place-items-center w-8 h-8 rounded-full border-2 ' +
  'text-[13px] font-bold leading-none flex-shrink-0 z-[2] bg-card transition-colors duration-150';

const STEP_CIRCLE_BY_STATE: Record<ProgressStepState, string> = {
  done: 'bg-brand-ok text-white border-brand-ok',
  current:
    'bg-brand-info text-white border-brand-info ' +
    // box-shadow ring (와이어프레임 02 line 89) — focus가 아닌 항상 표시되는 강조 링
    'shadow-[0_0_0_4px_hsl(var(--brand-color-info)/0.18)]',
  late:
    'bg-brand-critical text-white border-brand-critical ' +
    'shadow-[0_0_0_4px_hsl(var(--brand-color-critical)/0.18)] ' +
    'motion-safe:animate-pulse',
  future: 'bg-card text-muted-foreground border-brand-border-strong',
  // terminated — 반려/취소된 reachedStep. 회색 strike + 비활성 시각.
  terminated: 'bg-muted text-muted-foreground border-brand-border-strong opacity-60',
};

const STEP_LABEL_BY_STATE: Record<ProgressStepState, string> = {
  done: 'text-muted-foreground font-semibold',
  current: 'text-brand-info font-bold',
  late: 'text-brand-critical font-bold',
  future: 'text-foreground font-semibold',
  terminated: 'text-muted-foreground font-semibold line-through',
};

const CONNECTOR_BY_STATE: Record<'done' | 'pending', string> = {
  done: 'bg-brand-ok',
  pending: 'bg-brand-border-strong',
};

// ============================================================================
// Props
// ============================================================================

interface CheckoutProgressStepperProps {
  /** 어댑터(`useCheckoutProgressSteps`)가 도출한 step 배열 */
  steps: ProgressStepDescriptor[];
  /** 추가 className */
  className?: string;
}

// ============================================================================
// 보조 컴포넌트
// ============================================================================

/**
 * 단일 step 노드 — 원 + 라벨 + 메타(타임스탬프/예정일/액터) + "⚡ 당신" badge.
 * `React.memo` 적용 — props 안정 시 재렌더 방지.
 */
const StepNode = memo(function StepNode({
  step,
  isLast,
  ariaCurrent,
}: {
  step: ProgressStepDescriptor;
  isLast: boolean;
  ariaCurrent: boolean;
}) {
  const t = useTranslations('checkouts');
  const format = useFormatter();
  const { state, labelKey, actor, actorRole, timestamp, scheduledAt, isYourTurn, index } = step;

  // 원 안의 표기 — done ✓ / late ⚠ / terminated ✕ / current·future 1-based 인덱스 (와이어프레임 02 line 274-289)
  const circleContent = (() => {
    if (state === 'done') return <Check className="h-3.5 w-3.5" aria-hidden />;
    if (state === 'late') return <AlertTriangle className="h-3.5 w-3.5" aria-hidden />;
    if (state === 'terminated') return <X className="h-3.5 w-3.5" aria-hidden />;
    return <span aria-hidden>{index + 1}</span>;
  })();

  // step-meta — timestamp가 있으면 모든 상태에서 날짜+담당자 표시 / current(데이터 없음): "대기 중" / future: 예정일
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
              <b className="text-foreground font-semibold">{actor}</b>
              {actorRole ? (
                <>
                  <br />
                  <span className="text-muted-foreground">{actorRole}</span>
                </>
              ) : null}
            </>
          ) : null}
        </span>
      );
    }
    if (state === 'current' || state === 'late') {
      return <span className="block">{t('progressStep.metaPending')}</span>;
    }
    // future
    if (scheduledAt) {
      const date = new Date(scheduledAt);
      const formatted = format.dateTime(date, { month: '2-digit', day: '2-digit' });
      return <span className="block">{t('progressStep.metaScheduled', { date: formatted })}</span>;
    }
    return null;
  })();

  // 상태별 sr-only 텍스트 — 스크린리더 전용 (시각 라벨과 별도).
  // current/late는 aria-current="step"이 발화되므로 sr-only 중복 방지 위해 빈 문자열.
  const srState = (() => {
    if (state === 'current' || state === 'late') return '';
    if (state === 'done') return t('progressStep.stateDone');
    if (state === 'terminated') return t('progressStep.stateTerminated');
    return t('progressStep.stateFuture');
  })();

  return (
    <li
      className="flex flex-col items-center text-center px-1.5 min-w-0 relative"
      aria-current={ariaCurrent ? 'step' : undefined}
    >
      {/* 원 */}
      <div className={cn(STEP_CIRCLE_BASE, STEP_CIRCLE_BY_STATE[state])}>
        {circleContent}
        <span className="sr-only">{srState}</span>
      </div>

      {/* 연결선 — 다음 step 방향. CSS grid 의 connector는 별도 element로 그림 (line 위, 원 뒤) */}
      {!isLast && (
        <div
          className={cn(
            'absolute top-4 left-[calc(50%+18px)] right-[calc(-50%+18px)] h-0.5 z-[1]',
            state === 'done' ? CONNECTOR_BY_STATE.done : CONNECTOR_BY_STATE.pending
          )}
          aria-hidden
        />
      )}

      {/* 라벨 — label-ko (한국어 어절 단위 줄바꿈, P0-2 fix) */}
      <span
        className={cn(
          'label-ko text-xs leading-snug max-w-[12ch] mt-2 truncate-none',
          STEP_LABEL_BY_STATE[state]
        )}
      >
        {/* labelKey 형식: "stepper.{key}" — useTranslations 가 그대로 변환 */}
        {t(labelKey as never)}
      </span>

      {/* 메타 (타임스탬프 + 액터 / 예정일 / 대기). text-xs-tight = 11px (MICRO_TYPO SSOT) */}
      {metaLine ? (
        <span className="text-xs-tight leading-snug text-muted-foreground mt-1 font-mono">
          {metaLine}
        </span>
      ) : null}

      {/* "⚡ 당신" badge — current/late 단계에서 isYourTurn=true 인 경우만 (와이어프레임 02 line 278) */}
      {isYourTurn && (state === 'current' || state === 'late') ? (
        <span
          role="status"
          aria-label={t('progressStep.actorYouAriaLabel')}
          className={cn(
            'mt-1 inline-flex items-center px-1.5 rounded text-[10px] font-semibold leading-tight',
            'bg-brand-warning/18 text-brand-warning'
          )}
        >
          {t('progressStep.actorYou')}
        </span>
      ) : null}
    </li>
  );
});

// ============================================================================
// 메인 컴포넌트
// ============================================================================

/**
 * 통합 진행 흐름 stepper — 반출입 상세 페이지의 단일 진행 시각화.
 *
 * **REVIEW_RESULT.md P0-1 해결**: 기존 `CheckoutStatusStepper`(가로) + `WorkflowTimeline`(세로) 두 카드를
 * 단일 stepper로 통합. 각 step 하단에 actor/timestamp 메타 + "⚡ 당신" 마커.
 *
 * **REVIEW_RESULT.md P0-2 해결**: `label-ko` utility로 한국어 어절 단위 줄바꿈.
 * 1024px 이하에서도 단계명이 잘리지 않음 (max-width: 12ch).
 *
 * **데이터 흐름**:
 *   1. `useCheckoutProgressSteps()` 가 checkout + audit + descriptor → ProgressStepDescriptor[]
 *   2. 본 컴포넌트는 prop 으로만 받아 시각 변환 (presentational)
 *   3. 백엔드 audit timeline endpoint 인입 시 hook 만 보강하면 자동 풍부화
 *
 * **a11y**:
 *   - `<ol role="list">` 시맨틱 + 각 step `<li>` + `aria-current="step"` (current/late)
 *   - "당신" badge `role="status"` (info — polite)
 *   - 원 안의 ✓/⚠/숫자에 sr-only 상태 텍스트 동반
 */
function CheckoutProgressStepper({ steps, className }: CheckoutProgressStepperProps) {
  const t = useTranslations('checkouts');
  if (steps.length === 0) return null;

  // grid-cols 는 동적이므로 Tailwind JIT 안전망으로 inline style 사용 (`grid-cols-${N}` 클래스
  // 문자열은 JIT 스캐너가 못 찾음). N=5/8 양쪽 지원.
  return (
    <ol
      role="list"
      aria-label={t('progressStep.ariaLabel')}
      className={cn('grid gap-0 relative px-1 pt-1 pb-1.5', className)}
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
    >
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const ariaCurrent = step.state === 'current' || step.state === 'late';
        return (
          <StepNode
            key={`${step.status}-${step.index}`}
            step={step}
            isLast={isLast}
            ariaCurrent={ariaCurrent}
          />
        );
      })}
    </ol>
  );
}

export default memo(CheckoutProgressStepper);
