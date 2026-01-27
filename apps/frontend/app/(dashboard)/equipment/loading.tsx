import { Skeleton } from '@/components/ui/skeleton';

/**
 * 장비 목록 라우트 로딩 UI
 *
 * Next.js 16 패턴:
 * - Next.js가 자동으로 Suspense 경계 생성
 * - 라우트 전환 시 이 컴포넌트가 표시됨
 * - Server Component로 작성 가능 (상태 불필요)
 */
export default function EquipmentLoading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 헤더 스켈레톤 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* 필터 스켈레톤 */}
      <Skeleton className="h-[120px] w-full rounded-lg" />

      {/* 검색바 & 뷰 토글 스켈레톤 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Skeleton className="h-10 w-full sm:max-w-md" />
        <Skeleton className="h-10 w-[120px]" />
      </div>

      {/* 테이블 스켈레톤 */}
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>

      {/* 페이지네이션 스켈레톤 */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-8 w-[300px]" />
      </div>
    </div>
  );
}
