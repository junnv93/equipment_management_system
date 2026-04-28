import * as React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

export interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 줄 수 (default 3) */
  lines?: number;
  /** 마지막 줄 width 줄임 효과 (default true) */
  shortLast?: boolean;
}

export function SkeletonText({
  lines = 3,
  shortLast = true,
  className,
  ...props
}: SkeletonTextProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', shortLast && i === lines - 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  );
}
