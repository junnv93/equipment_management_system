import * as React from 'react';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTableRow,
  SkeletonHero,
  SkeletonForm,
} from '@/components/ui/skeleton/index';
import { FEEDBACK_KEYS } from '@/lib/i18n/feedback-keys';
import { cn } from '@/lib/utils';

export type RouteLoadingVariant = 'list' | 'detail' | 'form' | 'dashboard' | 'scan';

export interface RouteLoadingProps {
  /** 변형 — segment 종류에 따라 자동으로 적합한 placeholder 렌더 */
  variant?: RouteLoadingVariant;
  /** Hero(헤더) 영역 표시 여부 (default true) */
  hasHero?: boolean;
  /** 필터 영역 표시 여부 — list/dashboard에 적용 */
  hasFilters?: boolean;
  /** 행 또는 카드 개수 */
  rows?: number;
  /** 추가 className — outer wrapper에 적용 */
  className?: string;
}

const VARIANT_TO_FEEDBACK_KEY: Record<RouteLoadingVariant, string> = {
  list: FEEDBACK_KEYS.loadingList,
  detail: FEEDBACK_KEYS.loadingDetail,
  form: FEEDBACK_KEYS.loadingForm,
  dashboard: FEEDBACK_KEYS.loadingDashboard,
  scan: FEEDBACK_KEYS.loadingScan,
};

/**
 * RouteLoading — Route Segment Suspense fallback SSOT (L2)
 *
 * Next.js 16 best practice:
 * - async server component (i18n `getTranslations` 사용)
 * - 자체 `role="status"` + `aria-busy="true"` + sr-only label (Invariant I3)
 * - 자식 Skeleton 부품들은 `aria-hidden="true"` (중복 announce 회피, Invariant I8)
 *
 * 모든 `app/**\/loading.tsx`는 이 컴포넌트의 variant로 흡수.
 * 도메인 특수 케이스만 `// @route-loading: custom-justified` 마커 + allowlist.
 *
 * @see lib/i18n/feedback-keys.ts (FEEDBACK_KEYS)
 * @see components/ui/skeleton/index.ts (부품집)
 */
export async function RouteLoading({
  variant = 'list',
  hasHero = true,
  hasFilters = false,
  rows = 6,
  className,
}: RouteLoadingProps) {
  const t = await getTranslations();
  const labelKey = VARIANT_TO_FEEDBACK_KEY[variant];

  return (
    <section role="status" aria-busy="true" aria-live="polite" className={cn('w-full', className)}>
      <span className="sr-only">{t(labelKey)}</span>
      {hasHero ? <SkeletonHero className="mb-6" /> : null}
      {hasFilters ? <FilterRow className="mb-6" /> : null}
      <RouteLoadingBody variant={variant} rows={rows} />
    </section>
  );
}

function RouteLoadingBody({ variant, rows }: { variant: RouteLoadingVariant; rows: number }) {
  if (variant === 'detail') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <SkeletonText lines={3} />
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <Card>
        <CardContent className="p-6">
          <SkeletonForm fields={rows} />
        </CardContent>
      </Card>
    );
  }

  if (variant === 'dashboard') {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} lines={2} showHeader />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonCard lines={4} showHeader />
          <SkeletonCard lines={4} showHeader />
        </div>
      </div>
    );
  }

  if (variant === 'scan') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Skeleton className="size-48 rounded-lg" />
        <SkeletonText lines={2} className="w-64" />
      </div>
    );
  }

  // list (default) — table + card 혼합 변형 가능
  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-0">
          <div className="border-b px-4 py-3">
            <div className="flex gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-24" />
              ))}
            </div>
          </div>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="border-b last:border-0 px-4">
              <SkeletonTableRow columns={4} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function FilterRow({ className }: { className?: string }) {
  return (
    <div className={cn('flex gap-3', className)}>
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-10 w-32" />
    </div>
  );
}
