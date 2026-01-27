import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * 대시보드 로딩 상태 컴포넌트
 *
 * Next.js 16 App Router의 loading.tsx 컨벤션을 따릅니다.
 * - 자동으로 React Suspense boundary 생성
 * - 페이지 로딩 중 스켈레톤 UI 표시
 *
 * 접근성 (WCAG 2.1 AA):
 * - aria-busy="true"로 로딩 상태 표시
 * - aria-live="polite"로 스크린 리더에 알림
 * - role="status"로 상태 정보임을 명시
 * - sr-only 텍스트로 로딩 메시지 제공
 */
export default function DashboardLoading() {
  return (
    <div
      className="space-y-6 p-4 md:p-6"
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      {/* 스크린 리더용 로딩 메시지 */}
      <span className="sr-only">대시보드를 불러오는 중입니다...</span>

      {/* 환영 메시지 스켈레톤 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" aria-hidden="true" />
          <Skeleton className="h-4 w-48" aria-hidden="true" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" aria-hidden="true" />
          <Skeleton className="h-10 w-24" aria-hidden="true" />
          <Skeleton className="h-10 w-24" aria-hidden="true" />
        </div>
      </div>

      {/* 승인 대기 카드 스켈레톤 */}
      <div aria-label="승인 대기 현황 로딩 중">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-24" aria-hidden="true" />
          <Skeleton className="h-5 w-16" aria-hidden="true" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" aria-hidden="true" />
          ))}
        </div>
      </div>

      {/* 통계 카드 스켈레톤 */}
      <div
        className="grid gap-4 grid-cols-2 lg:grid-cols-4"
        aria-label="통계 카드 로딩 중"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} aria-hidden="true">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 탭 및 콘텐츠 스켈레톤 */}
      <div className="space-y-4" aria-label="대시보드 콘텐츠 로딩 중">
        <Skeleton className="h-10 w-80" aria-hidden="true" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card aria-hidden="true">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
          <Card aria-hidden="true">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card aria-hidden="true">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
