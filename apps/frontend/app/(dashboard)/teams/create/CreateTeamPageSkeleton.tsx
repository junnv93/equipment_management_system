import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getPageContainerClasses } from '@/lib/design-tokens';

/**
 * 페이지 전체 스켈레톤 (헤더 + 폼)
 * loading.tsx에서도 재사용 — 컨테이너는 Page(정적 셸) 또는 loading.tsx가 제공
 */
export function CreateTeamPageSkeleton() {
  return (
    <div className={getPageContainerClasses('form')}>
      {/* 헤더 스켈레톤 */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-5 w-40" />
        </div>
      </div>

      {/* 폼 스켈레톤 */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
