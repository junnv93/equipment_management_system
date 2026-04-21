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
  DASHBOARD_PENDING_APPROVAL_TOKENS,
  getDashboardStaggerDelay,
  getCountBasedUrgency,
  getUrgencyFeedbackClasses,
} from '@/lib/design-tokens';
import type {
  ApprovalCategoryPriority,
  PendingApprovalLayoutHint,
} from '@/lib/config/dashboard-config';
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
 * 모듈 레벨 빈 우선순위 상수 — `priorities = {}` 기본값 대신 사용
 *
 * 기본값으로 `{}` 리터럴을 쓰면 렌더마다 새 객체가 생성되어
 * useMemo의 deps 비교(===)가 매번 false → 불필요한 재계산 발생.
 * 모듈 레벨에 두면 참조가 항상 동일하게 유지됨.
 */
const EMPTY_PRIORITIES: Partial<Record<ApprovalCategory, ApprovalCategoryPriority>> = {} as const;

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
  /** 레이아웃 힌트 — config의 pendingApprovalLayoutHint에서 전달 */
  layoutHint?: PendingApprovalLayoutHint;
  /** 카테고리별 시각적 우선순위 — config의 approvalCategoryPriorities에서 전달 */
  priorities?: Partial<Record<ApprovalCategory, ApprovalCategoryPriority>>;
  /**
   * 시각적 부상(raised elevation) 적용 여부
   *
   * true → DASHBOARD_PENDING_APPROVAL_TOKENS.elevation.raised 적용.
   * 액션 카드가 주변 감시 카드보다 한 단계 높은 elevation을 가짐.
   */
  elevate?: boolean;
}

// 역할별 카드 제목/설명은 i18n에서 가져옴 (dashboard.pending.title.{role})

export function PendingApprovalCard({
  className,
  compact = false,
  layoutHint = 'grid',
  priorities = EMPTY_PRIORITIES,
  elevate = false,
}: PendingApprovalCardProps) {
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

  // SSOT: ROLE_TABS에서 파생된 카테고리 목록 + priority 주입
  const dashboardCategories = useMemo(
    () =>
      getDashboardApprovalCategories(
        userRole,
        FRONTEND_ROUTES.ADMIN.APPROVALS,
        tApprovals,
        priorities
      ),
    [userRole, tApprovals, priorities]
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

  // 공통 헤더 — 모든 레이아웃에서 공유
  const cardHeader = (
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
                'bg-brand-critical/10 text-brand-critical',
                getUrgencyFeedbackClasses(getCountBasedUrgency(totalPending), false)
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
  );

  // single-focus: 1개 카테고리 풀폭 히어로 카드
  if (layoutHint === 'single-focus') {
    const category = dashboardCategories[0];
    const Icon = getCategoryIcon(category.key);
    const count = counts?.[category.key] || 0;
    const hasItems = count > 0;

    return (
      <div
        className={cn(
          className,
          DASHBOARD_PENDING_APPROVAL_TOKENS.elevation[elevate ? 'raised' : 'default']
        )}
        data-testid="pending-approval-card"
        role="region"
        aria-labelledby="pending-approval-title"
        aria-describedby="pending-approval-description"
      >
        {cardHeader}
        <Link
          href={category.href}
          className="block"
          aria-label={t('categoryAriaLabel', { label: category.label, count })}
        >
          <div
            className={cn(
              DASHBOARD_PENDING_APPROVAL_TOKENS.heroCard,
              DASHBOARD_FOCUS.brand,
              hasItems && 'ring-2 ring-brand-critical/20'
            )}
          >
            <div
              className={cn(
                DASHBOARD_PENDING_APPROVAL_TOKENS.heroIconContainer,
                category.bgColor,
                'group-hover:scale-110'
              )}
            >
              <Icon
                className={cn(DASHBOARD_PENDING_APPROVAL_TOKENS.heroIcon, category.color)}
                aria-hidden="true"
              />
            </div>
            <span className={DASHBOARD_PENDING_APPROVAL_TOKENS.heroLabel}>{category.label}</span>
            <span
              className={cn(
                DASHBOARD_PENDING_APPROVAL_TOKENS.heroCount,
                hasItems
                  ? DASHBOARD_PENDING_APPROVAL_TOKENS.heroCountActive
                  : DASHBOARD_PENDING_APPROVAL_TOKENS.heroCountEmpty
              )}
            >
              {count}
            </span>
            <span className={DASHBOARD_PENDING_APPROVAL_TOKENS.heroDescription}>
              {hasItems ? t('clickToView') : t('noItems')}
            </span>
          </div>
        </Link>
      </div>
    );
  }

  // prioritized-grid: priority 계층화 그리드
  if (layoutHint === 'prioritized-grid') {
    // compact 컨테이너에서는 xl:grid-cols-4 제거 — 좁은 컬럼 압축 방지
    const prioritizedGridCols = compact
      ? DASHBOARD_PENDING_APPROVAL_TOKENS.gridLayouts['prioritized-grid-compact']
      : DASHBOARD_PENDING_APPROVAL_TOKENS.gridLayouts['prioritized-grid'];

    return (
      <div
        className={cn(
          className,
          DASHBOARD_PENDING_APPROVAL_TOKENS.elevation[elevate ? 'raised' : 'default']
        )}
        data-testid="pending-approval-card"
        role="region"
        aria-labelledby="pending-approval-title"
        aria-describedby="pending-approval-description"
      >
        {cardHeader}
        <div className={cn(prioritizedGridCols, 'gap-3')}>
          {dashboardCategories.map((category) => {
            const Icon = getCategoryIcon(category.key);
            const count = counts?.[category.key] || 0;
            const hasItems = count > 0;
            const isHero = category.priority === 'hero';
            const isCompact = category.priority === 'compact';

            const colSpan = isHero
              ? DASHBOARD_PENDING_APPROVAL_TOKENS.priorityHeroColSpan
              : DASHBOARD_PENDING_APPROVAL_TOKENS.priorityDefaultColSpan;
            const cardClass = isHero
              ? DASHBOARD_PENDING_APPROVAL_TOKENS.priorityHeroCard
              : isCompact
                ? DASHBOARD_PENDING_APPROVAL_TOKENS.priorityCompactCard
                : DASHBOARD_PENDING_APPROVAL_TOKENS.priorityDefaultCard;
            // compact 컨테이너에서 hero 아이콘 크기 한 단계 축소 (h-7→h-6)
            const iconClass = isHero
              ? compact
                ? DASHBOARD_PENDING_APPROVAL_TOKENS.priorityDefaultIcon
                : DASHBOARD_PENDING_APPROVAL_TOKENS.priorityHeroIcon
              : isCompact
                ? DASHBOARD_PENDING_APPROVAL_TOKENS.priorityCompactIcon
                : DASHBOARD_PENDING_APPROVAL_TOKENS.priorityDefaultIcon;
            // compact 컨테이너에서 hero 카운트 크기 축소 (3xl→2xl)
            const heroCountSize = compact ? 'text-2xl' : 'text-3xl';

            return (
              <Link
                key={category.key}
                href={category.href}
                className={cn('block', colSpan)}
                aria-label={t('categoryAriaLabel', { label: category.label, count })}
                data-priority={category.priority}
              >
                <div
                  className={cn(
                    cardClass,
                    DASHBOARD_FOCUS.brand,
                    hasItems && 'ring-1 ring-brand-critical/20'
                  )}
                >
                  <div
                    className={cn(
                      DASHBOARD_SIZES.approvalIcon,
                      'rounded-full flex items-center justify-center',
                      DASHBOARD_MOTION.iconTransition,
                      category.bgColor,
                      'group-hover:scale-110'
                    )}
                  >
                    <Icon className={cn(iconClass, category.color)} aria-hidden="true" />
                  </div>
                  <span
                    className={cn('font-medium text-foreground', isCompact ? 'text-xs' : 'text-sm')}
                  >
                    {category.label}
                  </span>
                  <span
                    className={cn(
                      'font-bold mt-1 tracking-tight tabular-nums font-mono',
                      DASHBOARD_MOTION.textColor,
                      isHero ? heroCountSize : isCompact ? 'text-lg' : 'text-2xl',
                      hasItems ? 'text-brand-critical' : 'text-muted-foreground'
                    )}
                  >
                    {count}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // grid (기존 동작 완전 보존)
  // 카테고리 수에 맞는 그리드 컬럼 결정
  const gridCols = compact
    ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4'
    : dashboardCategories.length <= 3
      ? 'grid-cols-2 md:grid-cols-3'
      : dashboardCategories.length <= 5
        ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
        : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-7';

  return (
    <div
      className={cn(
        className,
        DASHBOARD_PENDING_APPROVAL_TOKENS.elevation[elevate ? 'raised' : 'default']
      )}
      data-testid="pending-approval-card"
      role="region"
      aria-labelledby="pending-approval-title"
      aria-describedby="pending-approval-description"
    >
      {cardHeader}

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
                  'hover:shadow-md hover:scale-[1.02]',
                  'cursor-pointer',
                  DASHBOARD_FOCUS.brand,
                  hasItems && 'ring-2 ring-brand-critical/30'
                )}
              >
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div
                    className={cn(
                      `${DASHBOARD_SIZES.approvalIcon} rounded-full flex items-center justify-center mb-2`,
                      DASHBOARD_MOTION.iconTransition,
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
                      hasItems ? 'text-brand-critical' : 'text-muted-foreground'
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
