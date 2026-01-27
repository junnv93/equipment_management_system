import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface RouteLoadingProps {
  /** 표시할 스켈레톤 카드 개수 */
  cards?: number;
  /** 헤더 스켈레톤 표시 여부 */
  showHeader?: boolean;
  /** 테이블 형태 스켈레톤 */
  variant?: 'cards' | 'table' | 'detail';
}

/**
 * 라우트별 로딩 컴포넌트 (loading.tsx에서 사용)
 *
 * Next.js 16 Best Practice:
 * - Server Component 가능 (상태 없음)
 * - Suspense fallback으로 자동 사용됨
 */
export function RouteLoading({
  cards = 3,
  showHeader = true,
  variant = 'cards',
}: RouteLoadingProps) {
  if (variant === 'detail') {
    return (
      <div className="space-y-6">
        {showHeader && (
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-24" />
          </div>
        )}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="space-y-4">
        {showHeader && (
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
        )}
        <Card>
          <CardContent className="p-0">
            <div className="border-b p-4">
              <div className="flex gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-4 w-24" />
                ))}
              </div>
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-b last:border-0 p-4">
                <div className="flex gap-4">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-5 w-24" />
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default: cards
  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
