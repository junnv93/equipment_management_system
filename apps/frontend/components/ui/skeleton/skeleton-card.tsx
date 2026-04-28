import * as React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

export interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 카드 내부 콘텐츠 줄 수 (default 3) */
  lines?: number;
  /** 헤더(title) 표시 여부 */
  showHeader?: boolean;
  /** 액션 버튼 자리 표시 여부 */
  showAction?: boolean;
}

/**
 * SkeletonCard — list/grid 카드 placeholder
 *
 * dimension 룰: 실제 카드와 ±4px 동기 (CLS 0 목표)
 */
export function SkeletonCard({
  lines = 3,
  showHeader = true,
  showAction = false,
  className,
  ...props
}: SkeletonCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-4 flex flex-col gap-3', className)} {...props}>
      {showHeader ? (
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          {showAction ? <Skeleton className="h-8 w-16" /> : null}
        </div>
      ) : null}
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')} />
        ))}
      </div>
    </div>
  );
}
