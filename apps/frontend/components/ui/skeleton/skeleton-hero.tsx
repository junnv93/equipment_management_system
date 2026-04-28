import * as React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

export interface SkeletonHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  /** subtitle 표시 여부 */
  showSubtitle?: boolean;
  /** action 버튼 표시 여부 */
  showAction?: boolean;
}

/**
 * SkeletonHero — 페이지 상단 hero/header placeholder
 *
 * 일반적인 page header(아이콘 + 제목 + 부제목 + 액션) 패턴
 */
export function SkeletonHero({
  showSubtitle = true,
  showAction = true,
  className,
  ...props
}: SkeletonHeroProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)} {...props}>
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-md" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48" />
          {showSubtitle ? <Skeleton className="h-4 w-64" /> : null}
        </div>
      </div>
      {showAction ? <Skeleton className="h-10 w-28" /> : null}
    </div>
  );
}
