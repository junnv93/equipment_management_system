'use client';

import { Skeleton } from '@/components/ui/skeleton';

interface DialogSkeletonProps {
  /** 스켈레톤 행 수 (기본 4) */
  rows?: number;
  /** 하단 버튼 영역 표시 (기본 true) */
  hasActions?: boolean;
}

/**
 * Dialog/Sheet/Drawer lazy content 로딩 중 표시되는 스켈레톤 (SSOT)
 *
 * `useLazyMount` + `next/dynamic` 패턴에서 fallback으로 사용.
 *
 * @example
 * ```tsx
 * const LazyForm = dynamic(() => import('./HeavyForm'), {
 *   loading: () => <DialogSkeleton />,
 *   ssr: false,
 * });
 *
 * function EditDialog({ open, onOpenChange }) {
 *   const mounted = useLazyMount(open);
 *   return (
 *     <Dialog open={open} onOpenChange={onOpenChange}>
 *       <DialogContent>
 *         {mounted ? <LazyForm /> : <DialogSkeleton />}
 *       </DialogContent>
 *     </Dialog>
 *   );
 * }
 * ```
 */
export function DialogSkeleton({ rows = 4, hasActions = true }: DialogSkeletonProps) {
  return (
    <div className="space-y-4 p-1" role="status" aria-busy="true" aria-live="polite">
      {/* 제목 영역 */}
      <Skeleton className="h-6 w-1/2" aria-hidden="true" />

      {/* 입력 필드 영역 */}
      <div className="space-y-3 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-1/4" aria-hidden="true" />
            <Skeleton className="h-10 w-full" aria-hidden="true" />
          </div>
        ))}
      </div>

      {/* 액션 버튼 영역 */}
      {hasActions && (
        <div className="flex justify-end gap-2 pt-2">
          <Skeleton className="h-9 w-20" aria-hidden="true" />
          <Skeleton className="h-9 w-20" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
