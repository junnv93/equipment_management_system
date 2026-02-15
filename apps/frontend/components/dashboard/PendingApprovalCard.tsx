'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  Package,
  FileCheck,
  ClipboardCheck,
  ArrowUpFromLine,
  ArrowDownToLine,
  AlertTriangle,
  Trash2,
  Calendar,
  Code,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  approvalsApi,
  type PendingCountsByCategory,
  type ApprovalCategory,
} from '@/lib/api/approvals-api';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import {
  computeApprovalTotal,
  getDashboardApprovalCategories,
} from '@/lib/utils/approval-count-utils';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';

/**
 * 아이콘 매핑
 *
 * TAB_META의 icon 문자열 → 실제 lucide-react 컴포넌트
 * ApprovalsClient.tsx의 ICONS와 동일한 패턴
 */
const ICONS: Record<string, React.ElementType> = {
  Package,
  FileCheck,
  ClipboardCheck,
  ArrowUpFromLine,
  ArrowDownToLine,
  AlertTriangle,
  Trash2,
  Calendar,
  Code,
};

/**
 * TAB_META.icon 이름 → lucide 컴포넌트 매핑
 * (TAB_META에서 아이콘 이름을 가져와 컴포넌트로 변환)
 */
import { TAB_META } from '@/lib/api/approvals-api';

function getCategoryIcon(category: ApprovalCategory): React.ElementType {
  const iconName = TAB_META[category]?.icon;
  return ICONS[iconName] || Package;
}

interface PendingApprovalCardProps {
  className?: string;
}

/**
 * 역할별 카드 제목
 */
function getCardTitle(role: string): string {
  switch (role.toLowerCase()) {
    case 'test_engineer':
      return '내 요청 현황';
    case 'technical_manager':
      return '팀 승인 대기';
    case 'quality_manager':
      return '검토 대기';
    case 'lab_manager':
      return '시험소 승인 대기';
    default:
      return '승인 대기';
  }
}

/**
 * 역할별 카드 설명
 */
function getCardDescription(role: string): string {
  switch (role.toLowerCase()) {
    case 'test_engineer':
      return '본인이 신청한 항목의 처리 현황';
    case 'technical_manager':
      return '팀 내 승인이 필요한 항목';
    case 'quality_manager':
      return '검토가 필요한 항목';
    case 'lab_manager':
      return '시험소 내 승인이 필요한 항목';
    default:
      return '승인 대기 중인 항목';
  }
}

export function PendingApprovalCard({ className }: PendingApprovalCardProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'user';

  // SSOT: ApprovalsService (GET /api/approvals/counts)
  // 네비 뱃지, 대시보드 카드, 승인 페이지가 동일 query key 공유
  const {
    data: counts,
    isLoading,
    error,
  } = useQuery<PendingCountsByCategory>({
    queryKey: queryKeys.approvals.counts(userRole),
    queryFn: () => approvalsApi.getPendingCounts(),
    staleTime: CACHE_TIMES.SHORT,
    refetchInterval: 60000,
  });

  // SSOT: ROLE_TABS에서 파생된 카테고리 목록
  const dashboardCategories = useMemo(
    () => getDashboardApprovalCategories(userRole, FRONTEND_ROUTES.ADMIN.APPROVALS),
    [userRole]
  );

  // SSOT: ROLE_TABS 기반 총합 계산
  const totalPending = computeApprovalTotal(counts, userRole);

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={cn('border-destructive', className)}>
        <CardContent className="p-4 flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>승인 대기 정보를 불러오는데 실패했습니다.</span>
        </CardContent>
      </Card>
    );
  }

  // 승인 권한이 없는 역할(test_engineer 등)은 카테고리가 빈 배열
  if (dashboardCategories.length === 0) {
    return null;
  }

  const cardTitle = getCardTitle(userRole);
  const cardDescription = getCardDescription(userRole);

  // 카테고리 수에 맞는 그리드 컬럼 결정
  const gridCols =
    dashboardCategories.length <= 3
      ? 'grid-cols-2 md:grid-cols-3'
      : dashboardCategories.length <= 5
        ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
        : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-7';

  return (
    <div
      className={className}
      data-testid="pending-approval-card"
      role="region"
      aria-labelledby="pending-approval-title"
      aria-describedby="pending-approval-description"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 id="pending-approval-title" className="text-lg font-semibold">
            {cardTitle}
          </h2>
          <p id="pending-approval-description" className="text-sm text-muted-foreground">
            {cardDescription}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {totalPending > 0 && (
            <>
              <Badge
                variant="secondary"
                className="bg-ul-red/10 text-ul-red dark:bg-ul-red/20 dark:text-red-300 animate-pulse"
                aria-live="polite"
                aria-atomic="true"
              >
                총 {totalPending}건
              </Badge>
              <Link href={FRONTEND_ROUTES.ADMIN.APPROVALS}>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  aria-label="전체 승인 관리 페이지로 이동"
                >
                  전체 보기
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className={cn('grid gap-4', gridCols)}>
        {dashboardCategories.map((category) => {
          const Icon = getCategoryIcon(category.key);
          const count = counts?.[category.key] || 0;
          const hasItems = count > 0;

          return (
            <Link
              key={category.key}
              href={category.href}
              className="block group"
              aria-label={`${category.label} ${count}건`}
            >
              <Card
                className={cn(
                  'transition-all duration-200',
                  'hover:shadow-md hover:scale-[1.02]',
                  'cursor-pointer',
                  'focus-within:ring-2 focus-within:ring-ul-info focus-within:ring-offset-2',
                  hasItems && 'ring-2 ring-ul-red/30 dark:ring-ul-red/50'
                )}
              >
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center mb-2',
                      'transition-colors duration-200',
                      category.bgColor,
                      'group-hover:scale-110 transition-transform'
                    )}
                  >
                    <Icon className={cn('h-6 w-6', category.color)} aria-hidden="true" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{category.label}</span>
                  <span
                    className={cn(
                      'text-2xl font-bold mt-1',
                      'transition-colors duration-200',
                      hasItems ? 'text-ul-red dark:text-red-400' : 'text-muted-foreground'
                    )}
                  >
                    {count}
                  </span>
                  {hasItems && (
                    <span className="text-xs text-muted-foreground mt-1">클릭하여 확인</span>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
