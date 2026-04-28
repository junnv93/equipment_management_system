import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Skeleton — Pending placeholder primitive
 *
 * - `motion-safe:animate-pulse motion-reduce:opacity-60` (reduced-motion 지원)
 * - `bg-primary/10` semantic (Design Token, 하드코딩 0)
 * - 자체는 `aria-hidden="true"` — 부모 RouteLoading/section이 `role="status"` 책임
 *   (중복 announce 회피 — Invariant I8 준수)
 *
 * @example
 * ```tsx
 * <Skeleton className="h-8 w-32" />
 * ```
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'motion-safe:animate-pulse motion-reduce:opacity-60 rounded-md bg-primary/10',
        className
      )}
      {...props}
    />
  );
}
