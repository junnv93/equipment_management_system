import * as React from 'react';
import { cn } from '@/lib/utils';
import { SPINNER_SIZES, type SpinnerSize } from '@/lib/design-tokens';

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  /** 크기 — design token (sm 14px / md 16px / lg 20px) */
  size?: SpinnerSize;
  /**
   * 자체 sr-only 텍스트.
   * Button.loadingLabel처럼 부모가 sr-only 책임을 갖는 경우 빈 문자열로 비활성.
   * 빈 문자열일 경우 `aria-hidden="true"`로 처리되어 스크린리더 침묵.
   */
  srLabel?: string;
}

/**
 * Spinner — Pending feedback SSOT (Loader2 등 외부 lib 사용 금지)
 *
 * - SVG inline (bundle 비용 0)
 * - `motion-safe:animate-spin motion-reduce:opacity-70` (reduced-motion 지원)
 * - 부모(Button/SearchInput 등)가 sr-only 책임을 가질 때는 `srLabel=""` 전달
 *
 * @example
 * ```tsx
 * <Spinner size="md" srLabel={t(FEEDBACK_KEYS.processing)} />
 * ```
 */
export const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ size = 'md', srLabel = '', className, ...props }, ref) => {
    const ariaHidden = srLabel === '' ? true : undefined;
    return (
      <span className="inline-flex items-center" role={srLabel ? 'status' : undefined}>
        <svg
          ref={ref}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden={ariaHidden}
          className={cn(
            SPINNER_SIZES[size],
            'motion-safe:animate-spin motion-reduce:opacity-70 text-current',
            className
          )}
          {...props}
        >
          {/* track */}
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeWidth="3"
          />
          {/* head — 75% arc */}
          <path
            d="M22 12a10 10 0 0 0-10-10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        {srLabel ? <span className="sr-only">{srLabel}</span> : null}
      </span>
    );
  }
);
Spinner.displayName = 'Spinner';
