import * as React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

export interface SkeletonTableRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 컬럼 수 (default 4) */
  columns?: number;
  /** 첫 컬럼을 더 넓게 (label) — default true */
  firstColumnWide?: boolean;
}

/**
 * SkeletonTableRow — 테이블 한 행 placeholder
 *
 * 실제 테이블 row height(보통 h-12 = 48px)와 동기
 */
export function SkeletonTableRow({
  columns = 4,
  firstColumnWide = true,
  className,
  ...props
}: SkeletonTableRowProps) {
  return (
    <div className={cn('flex items-center gap-4 py-3', className)} {...props}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4', firstColumnWide && i === 0 ? 'w-40' : 'w-24')} />
      ))}
    </div>
  );
}
