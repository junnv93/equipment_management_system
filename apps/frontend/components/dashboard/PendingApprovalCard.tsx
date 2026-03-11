'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
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
  DASHBOARD_MOTION,
  DASHBOARD_SIZES,
  DASHBOARD_FOCUS,
  getDashboardStaggerDelay,
  getCountBasedUrgency,
  getUrgencyFeedbackClasses,
} from '@/lib/design-tokens';
import {
  approvalsApi,
  type PendingCountsByCategory,
  type ApprovalCategory,
} from '@/lib/api/approvals-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
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
  /** 좁은 컨테이너(예: 대시보드 우측 컬럼)에서 그리드 컬럼 수 제한 */
  compact?: boolean;
}

// 역할별 카드 제목/설명은 i18n에서 가져옴 (dashboard.pending.title.{role})

export function PendingApprovalCard({ className, compact = false }: PendingApprovalCardProps) {
  const { data: session, status } = useSession();
  const t = useTranslations('dashboard.pending');
  const tApprovals = useTranslations('approvals');
  const userRole = session?.user?.role || 'user';

  // SSOT: ApprovalsService (GET /api/approvals/counts)
  // 네비 뱃지, 대시보드 카드, 승인 페이지가 동일 query key 공유
  // Architecture v3: REFETCH_STRATEGIES.NORMAL 전략 (window focus만)
  // enabled: 세션 로딩 중 401 방지 (apiClient의 getSession() 타이밍 이슈)
  const {
    data: counts,
    isLoading,
    error,
  } = useQuery<PendingCountsByCategory>({
    queryKey: queryKeys.approvals.counts(userRole),
    queryFn: () => approvalsApi.getPendingCounts(),
    enabled: status === 'authenticated',
    ...QUERY_CONFIG.PENDING_APPROVALS, // SSOT: REFETCH_STRATEGIES.NORMAL
  });

  // SSOT: ROLE_TABS에서 파생된 카테고리 목록
  const dashboardCategories = useMemo(
    () => getDashboardApprovalCategories(userRole, FRONTEND_ROUTES.ADMIN.APPROVALS, tApprovals),
    [userRole, tApprovals]
  );

  // SSOT: ROLE_TABS 기반 총합 계산
  const totalPending = computeApprovalTotal(counts, userRole);

  if (isLoading || status === 'loading') {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-28 rounded-lg"
              style={{ animationDelay: getDashboardStaggerDelay(i, 'grid') }}
            />
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
          <span>{t('error')}</span>
        </CardContent>
      </Card>
    );
  }

  // 승인 권한이 없는 역할(test_engineer 등)은 카테고리가 빈 배열
  if (dashboardCategories.length === 0) {
    return null;
  }

  const roleLower = userRole.toLowerCase();
  const titleKey = `title.${roleLower}` as Parameters<typeof t>[0];
  const descKey = `description.${roleLower}` as Parameters<typeof t>[0];
  const cardTitle = t.has(titleKey) ? t(titleKey) : t('title.default');
  const cardDescription = t.has(descKey) ? t(descKey) : t('description.default');

  // 카테고리 수에 맞는 그리드 컬럼 결정
  // compact=true: 좁은 컨테이너에서 최대 4열 (lg:grid-cols-7 overflow 방지)
  const gridCols = compact
    ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4'
    : dashboardCategories.length <= 3
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
          <h2 id="pending-approval-title" className="text-lg font-semibold tracking-tight">
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
                className={cn(
                  'bg-ul-red/10 text-ul-red dark:bg-ul-red/20',
                  getUrgencyFeedbackClasses(getCountBasedUrgency(totalPending), false) // 애니메이션 없음
                )}
                aria-live="polite"
                aria-atomic="true"
              >
                {t('totalCount', { count: totalPending })}
              </Badge>
              <Link href={FRONTEND_ROUTES.ADMIN.APPROVALS}>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  aria-label={t('viewAllAriaLabel')}
                >
                  {t('viewAll')}
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
              aria-label={t('categoryAriaLabel', { label: category.label, count })}
            >
              <Card
                className={cn(
                  DASHBOARD_MOTION.cardHover,
                  'motion-reduce:transition-none hover:shadow-md hover:scale-[1.02]',
                  'cursor-pointer',
                  DASHBOARD_FOCUS.brand,
                  hasItems && 'ring-2 ring-ul-red/30 dark:ring-ul-red/50'
                )}
              >
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div
                    className={cn(
                      `${DASHBOARD_SIZES.approvalIcon} rounded-full flex items-center justify-center mb-2`,
                      `${DASHBOARD_MOTION.iconTransition} motion-reduce:transition-none`,
                      category.bgColor,
                      'group-hover:scale-110'
                    )}
                  >
                    <Icon className={cn('h-6 w-6', category.color)} aria-hidden="true" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{category.label}</span>
                  <span
                    className={cn(
                      'text-2xl font-bold mt-1 tracking-tight tabular-nums',
                      DASHBOARD_MOTION.textColor,
                      hasItems ? 'text-ul-red' : 'text-muted-foreground'
                    )}
                  >
                    {count}
                  </span>
                  {hasItems && (
                    <span className="text-xs text-muted-foreground mt-1">{t('clickToView')}</span>
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
