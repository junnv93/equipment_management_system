'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import type { SpinnerSize } from '@/lib/design-tokens';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium motion-safe:transition-[background-color,border-color,color,transform] motion-safe:duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] aria-busy:cursor-wait',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const SIZE_TO_SPINNER: Record<
  NonNullable<VariantProps<typeof buttonVariants>['size']>,
  SpinnerSize
> = {
  default: 'md',
  sm: 'sm',
  lg: 'lg',
  icon: 'md',
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /**
   * Pending 상태. true 시:
   * - `aria-busy="true"` + `disabled` 자동 적용
   * - `loadingPosition`에 따라 spinner 배치
   * - `loadingLabel` sr-only 텍스트 (없으면 spinner aria-hidden)
   *
   * BC: 미지정 시 기존 동작 그대로 (false default).
   */
  loading?: boolean;
  /**
   * Pending 시 sr-only 사유 텍스트.
   * 권장: i18n 키 (`t(FEEDBACK_KEYS.saving)` 등). 빈 문자열이면 announce 없음.
   */
  loadingLabel?: string;
  /**
   * Spinner 배치:
   * - `start` (default): spinner + space + children
   * - `end`: children + space + spinner
   * - `replace`: children 시각적 숨김 + spinner만 (width는 children dimension 유지 → CLS 0)
   */
  loadingPosition?: 'start' | 'end' | 'replace';
  /** Spinner 크기 — 미지정 시 button size에서 자동 추론 (sm→sm, lg→lg, default/icon→md) */
  spinnerSize?: SpinnerSize;
  /**
   * Pending 상태 첫 N ms 동안 spinner 표시 안 함 — 빠른 mutation에서 flicker 방지.
   * default 200. 0이면 즉시 표시.
   */
  pendingDelayMs?: number;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingLabel = '',
      loadingPosition = 'start',
      spinnerSize,
      pendingDelayMs = 200,
      disabled,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    // flicker 방지: loading=true 후 pendingDelayMs 경과해야 spinner 표시
    const [showSpinner, setShowSpinner] = React.useState(false);
    React.useEffect(() => {
      if (!loading) {
        setShowSpinner(false);
        return;
      }
      if (pendingDelayMs <= 0) {
        setShowSpinner(true);
        return;
      }
      const t = setTimeout(() => setShowSpinner(true), pendingDelayMs);
      return () => clearTimeout(t);
    }, [loading, pendingDelayMs]);

    // pending 동안 클릭 swallow (이중 제출 방지)
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      onClick?.(e);
    };

    const resolvedSpinnerSize: SpinnerSize = spinnerSize ?? SIZE_TO_SPINNER[size ?? 'default'];
    const spinnerNode = showSpinner ? (
      <Spinner size={resolvedSpinnerSize} srLabel="" aria-hidden="true" />
    ) : null;

    // asChild는 Slot 의미 보호상 spinner 주입 불가 — children 그대로
    if (asChild) {
      if (process.env.NODE_ENV !== 'production' && loading) {
        console.warn(
          '[Button] `loading` is ignored when `asChild` is true. Inject spinner manually within children.'
        );
      }
      return (
        <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </Comp>
      );
    }

    const renderContent = () => {
      if (loading && loadingPosition === 'replace') {
        return (
          <>
            {/* invisible children — width 유지하여 CLS 방지 */}
            <span className="invisible">{children}</span>
            <span className="absolute inset-0 inline-flex items-center justify-center">
              {spinnerNode}
            </span>
          </>
        );
      }
      if (loading && loadingPosition === 'end') {
        return (
          <>
            {children}
            {spinnerNode ? <span className="ml-2 inline-flex">{spinnerNode}</span> : null}
          </>
        );
      }
      // start (default)
      return (
        <>
          {spinnerNode ? <span className="mr-2 inline-flex">{spinnerNode}</span> : null}
          {children}
        </>
      );
    };

    return (
      <Comp
        ref={ref}
        className={cn(
          buttonVariants({ variant, size, className }),
          loading && loadingPosition === 'replace' && 'relative'
        )}
        aria-busy={loading || undefined}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {renderContent()}
        {loading && loadingLabel ? <span className="sr-only">{loadingLabel}</span> : null}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
