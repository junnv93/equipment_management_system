'use client';

import * as React from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { SURFACE_INLINE_ACTION_TOKENS, type SurfaceInlineActionVariant } from '@/lib/design-tokens';

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
 * **Loading 상태 a11y**:
 *   - `aria-busy="true"` + `disabled` 강제 + Loader2 spinner를 텍스트 *옆에* 렌더 (텍스트 가시성 유지).
 *   - 텍스트를 spinner로 교체하지 않음 — 스크린리더가 액션 의미를 잃지 않도록.
 */

export interface InlineActionButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  variant: SurfaceInlineActionVariant;
  loading?: boolean;
  leadingIcon?: LucideIcon;
  children: React.ReactNode;
}

const InlineActionButtonImpl = React.forwardRef<HTMLButtonElement, InlineActionButtonProps>(
  function InlineActionButton(
    { variant, loading = false, leadingIcon: LeadingIcon, className, children, disabled, ...rest },
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
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        ) : LeadingIcon ? (
          <LeadingIcon className="h-3 w-3" aria-hidden="true" />
        ) : null}
        <span>{children}</span>
      </button>
    );
  }
);

export const InlineActionButton = React.memo(InlineActionButtonImpl);
InlineActionButton.displayName = 'InlineActionButton';
