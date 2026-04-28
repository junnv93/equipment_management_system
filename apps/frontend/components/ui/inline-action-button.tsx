'use client';

import * as React from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { SURFACE_INLINE_ACTION_TOKENS, type SurfaceInlineActionVariant } from '@/lib/design-tokens';

// ── 미러 타입 동기 — 구조적 type checking이 호출처에서 자동 enforce ──
// `InlineActionVariantKey`(shared-constants, backend도 import 가능한 string literal mirror)와
// `SurfaceInlineActionVariant`(design-tokens, frontend 토큰 어휘)는 동일 union이어야 한다.
// 호출처 NextStepPanel에서 `variant={resolveInlineActionVariant(...)}` 형태로 미러 타입의
// 결과를 atom의 `variant: SurfaceInlineActionVariant` prop에 전달 — 두 타입이 구조적으로
// 호환되지 않으면 TypeScript가 호출처에서 즉시 빌드 에러. 별도 bridge assertion 불필요.

/**
 * Inline Action Button — 행 단위 soft-tint 액션 atom (REVIEW_RESULT.md §4.1, 와이어프레임 04).
 *
 * 와이어프레임 04 spec table 7개 속성을 `SURFACE_INLINE_ACTION_TOKENS`로 캡슐화:
 *   height 28px / bg `hsl(brand/0.10)` / color `hsl(brand)` / border `1px solid hsl(brand/0.22)`
 *   / no shadow / font-weight 600 / icon optional.
 *
 * variant 결정은 호출처 책임이지만 SSOT 헬퍼 `resolveInlineActionVariant`(shared-constants)
 * 사용을 권장. `urgency='critical'` → 'danger', `'warning'` → 'warning',
 * `'normal'` + isMyTurn → 'warning' (승인류) / 'ok' (반환류) / 'info' (default).
 *
 * **shadcn Button과 별도 atom인 이유**:
 *   - asChild Slot 패턴은 행 단위 마이그레이션에서 사용처 0건 (YAGNI).
 *   - SURFACE_INLINE_ACTION_TOKENS는 base/variant 합성 어휘가 cva와 다른 형태로,
 *     별도 atom이 design-tokens와 1:1 결합되어 verify-design-tokens 검증 단순화.
 *
 * **i18n 도메인 중립성**:
 *   - atom은 i18n에 의존하지 않음. `loadingLabel` prop으로 호출처가 지역화 텍스트 전달.
 *   - children도 i18n 처리된 ReactNode 받음 — atom 자체는 raw 문자열 모름.
 *
 * **Loading 상태 a11y**:
 *   - `aria-busy="true"` + `disabled` 강제.
 *   - Loader2 spinner는 aria-hidden (시각 전용).
 *   - `<span class="sr-only">{loadingLabel}</span>` 추가로 스크린리더가 "로딩 중" 명시 발화.
 *   - children 텍스트는 그대로 가시 — 액션 의미 유지.
 *
 * **Performance**:
 *   - `React.memo`로 wrap하지만 효과는 호출처의 prop stability에 의존.
 *   - 호출처는 `onClick` 같은 함수 prop을 `useCallback`으로 안정화하거나 *부모 자체*가 memo여야 함.
 *   - inline arrow `onClick={(e) => {...}}` 패턴은 memo를 무력화하므로 반드시 stabilize.
 */

export interface InlineActionButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  variant: SurfaceInlineActionVariant;
  loading?: boolean;
  /** sr-only 라벨 (스크린리더 발화). 기본 'Loading…'. 한국어/다국어는 `t('common.loading')` 전달 권장. */
  loadingLabel?: string;
  leadingIcon?: LucideIcon;
  children: React.ReactNode;
}

const InlineActionButtonImpl = React.forwardRef<HTMLButtonElement, InlineActionButtonProps>(
  function InlineActionButton(
    {
      variant,
      loading = false,
      loadingLabel = 'Loading…',
      leadingIcon: LeadingIcon,
      className,
      children,
      disabled,
      ...rest
    },
    ref
  ) {
    const isDisabled = loading || disabled;
    return (
      <button
        ref={ref}
        type={rest.type ?? 'button'}
        disabled={isDisabled}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        className={cn(
          SURFACE_INLINE_ACTION_TOKENS.base,
          SURFACE_INLINE_ACTION_TOKENS.variant[variant],
          className
        )}
        {...rest}
      >
        {loading ? (
          <>
            <Loader2
              className={cn(SURFACE_INLINE_ACTION_TOKENS.iconSize, 'animate-spin')}
              aria-hidden="true"
            />
            <span className="sr-only">{loadingLabel}</span>
          </>
        ) : LeadingIcon ? (
          <LeadingIcon className={SURFACE_INLINE_ACTION_TOKENS.iconSize} aria-hidden="true" />
        ) : null}
        <span>{children}</span>
      </button>
    );
  }
);

export const InlineActionButton = React.memo(InlineActionButtonImpl);
InlineActionButton.displayName = 'InlineActionButton';
