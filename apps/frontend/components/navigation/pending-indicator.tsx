'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { PENDING_DIMENSIONS, PENDING_COLORS } from '@/lib/design-tokens';

export type PendingIndicatorVariant = 'dot' | 'border' | 'opacity' | 'none';

export interface PendingIndicatorProps {
  variant: PendingIndicatorVariant;
  pending: boolean;
  className?: string;
}

/**
 * PendingIndicator — L1 Link-local pending 시각 신호 SSOT
 *
 * 변형:
 * - `dot`: 사이드바 우측 4px dot (motion-safe pulse, motion-reduce 정적 dot)
 * - `border`: 모바일 좌측 2px border-l 강조
 * - `opacity`: 부모 요소 opacity 변화 — 자체 렌더 없음 (호출자가 className으로 처리)
 * - `none`: 비활성화 (특수 케이스용 escape hatch)
 *
 * 자체는 `aria-hidden="true"` — sr-only는 NavLink가 책임 (중복 announce 회피).
 */
export function PendingIndicator({ variant, pending, className }: PendingIndicatorProps) {
  if (!pending || variant === 'none' || variant === 'opacity') return null;

  if (variant === 'dot') {
    return (
      <span
        aria-hidden="true"
        data-pending-indicator="dot"
        className={cn(
          'ml-1.5 inline-block rounded-full',
          PENDING_DIMENSIONS.dotSm,
          PENDING_COLORS.indicator,
          'motion-safe:animate-pulse motion-reduce:opacity-100',
          className
        )}
      />
    );
  }

  // border
  return (
    <span
      aria-hidden="true"
      data-pending-indicator="border"
      className={cn(
        'absolute inset-y-0 left-0',
        PENDING_DIMENSIONS.borderL,
        PENDING_COLORS.border,
        className
      )}
    />
  );
}

/**
 * pending 시 부모에 적용할 opacity className helper
 * variant=opacity 일 때 NavLink가 사용
 */
export function getPendingOpacityClass(pending: boolean): string {
  return pending ? 'opacity-70 transition-opacity duration-150' : '';
}
