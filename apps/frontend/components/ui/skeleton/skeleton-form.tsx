import * as React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

export interface SkeletonFormProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 필드 수 (default 4) */
  fields?: number;
  /** submit 영역(버튼들) 표시 여부 */
  showSubmit?: boolean;
}

/**
 * SkeletonForm — 폼 placeholder
 *
 * 표준 폼 한 필드 = label(h-4) + input(h-10). dimension 룰 ±4px
 */
export function SkeletonForm({
  fields = 4,
  showSubmit = true,
  className,
  ...props
}: SkeletonFormProps) {
  return (
    <div className={cn('flex flex-col gap-5', className)} {...props}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      {showSubmit ? (
        <div className="flex justify-end gap-2 pt-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      ) : null}
    </div>
  );
}
