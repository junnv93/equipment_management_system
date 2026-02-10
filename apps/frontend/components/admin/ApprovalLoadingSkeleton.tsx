import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ApprovalLoadingSkeletonProps {
  cardHeight?: string;
}

/**
 * 승인 페이지 공통 로딩 스켈레톤
 */
export function ApprovalLoadingSkeleton({ cardHeight = 'h-20' }: ApprovalLoadingSkeletonProps) {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Skeleton className="h-10 w-64" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className={`${cardHeight} w-full`} />
            <Skeleton className={`${cardHeight} w-full`} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
