import { Skeleton } from '@/components/ui/skeleton';

/**
 * 팀 목록 페이지 로딩 UI
 *
 * Next.js 16 패턴: loading.tsx로 라우트 전환 시 로딩 상태 표시
 */
export default function TeamsLoading() {
  return (
    <div className="container mx-auto py-6 space-y-6" aria-busy="true" aria-live="polite">
      {/* 페이지 헤더 스켈레톤 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>

      {/* 검색/필터 스켈레톤 */}
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1 max-w-md" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* 팀 카드 그리드 스켈레톤 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-4 pt-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
            {/* 팀원 아바타 스켈레톤 */}
            <div className="flex -space-x-2 pt-2">
              {[...Array(5)].map((_, j) => (
                <Skeleton key={j} className="h-8 w-8 rounded-full border-2 border-background" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
