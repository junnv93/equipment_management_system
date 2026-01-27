import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * 팀 상세 페이지 로딩 UI
 *
 * Next.js 16 패턴: loading.tsx로 라우트 전환 시 로딩 상태 표시
 */
export default function TeamDetailLoading() {
  return (
    <div className="container mx-auto py-6 space-y-6" aria-busy="true" aria-live="polite">
      {/* 뒤로가기 & 헤더 */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* 팀 정보 카드 */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 탭 */}
      <div className="space-y-4">
        <div className="flex gap-2 border-b">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>

        {/* 테이블 스켈레톤 */}
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <Skeleton className="h-10 w-full max-w-md" />
            </div>
            <div className="divide-y">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
