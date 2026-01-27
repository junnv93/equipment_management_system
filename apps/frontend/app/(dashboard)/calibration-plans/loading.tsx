import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * 교정계획서 라우트 로딩 UI
 *
 * Next.js 16 패턴:
 * - Next.js가 자동으로 Suspense 경계 생성
 * - calibration-plans/* 하위 모든 라우트에서 공유
 */
export default function CalibrationPlansLoading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 헤더 스켈레톤 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* 메인 카드 스켈레톤 */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          {/* 테이블 헤더 */}
          <Skeleton className="h-10 w-full mb-2" />
          {/* 테이블 행들 */}
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full mb-2" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
