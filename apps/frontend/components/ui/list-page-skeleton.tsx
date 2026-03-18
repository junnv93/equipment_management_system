/**
 * 공통 목록 페이지 스켈레톤 컴포넌트
 *
 * 일관성 있는 로딩 UI를 제공하여 사용자 경험 향상
 *
 * 사용 페이지:
 * - teams/loading.tsx
 * - calibration/loading.tsx
 * - equipment/loading.tsx
 * - calibration-plans/loading.tsx
 *
 * @example
 * ```tsx
 * // app/(dashboard)/teams/loading.tsx
 * export default function TeamsLoading() {
 *   return (
 *     <ListPageSkeleton
 *       title="팀 관리"
 *       showFilters={true}
 *       filterCount={2}
 *       gridCols={{ base: 1, md: 2, lg: 3 }}
 *     />
 *   );
 * }
 * ```
 */

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getPageContainerClasses } from '@/lib/design-tokens';

interface ListPageSkeletonProps {
  /** Page title (optional, shows skeleton title if provided) */
  title?: string;
  /** Description (optional) */
  description?: string;
  /** Show filter bar */
  showFilters?: boolean;
  /** Number of filter dropdowns */
  filterCount?: number;
  /** Show search bar */
  showSearch?: boolean;
  /** Number of cards to display */
  cardCount?: number;
  /** Grid columns configuration */
  gridCols?: {
    base?: number;
    md?: number;
    lg?: number;
  };
  /** Show action button (e.g., "팀 추가", "장비 등록") */
  showActionButton?: boolean;
}

/**
 * 목록 페이지 스켈레톤
 */
export function ListPageSkeleton({
  title,
  description,
  showFilters = true,
  filterCount = 2,
  showSearch = true,
  cardCount = 6,
  gridCols = { base: 1, md: 2, lg: 3 },
  showActionButton = true,
}: ListPageSkeletonProps) {
  const gridClass = cn(
    'grid gap-6',
    gridCols.base === 1 && 'grid-cols-1',
    gridCols.base === 2 && 'grid-cols-2',
    gridCols.md === 2 && 'md:grid-cols-2',
    gridCols.md === 3 && 'md:grid-cols-3',
    gridCols.lg === 2 && 'lg:grid-cols-2',
    gridCols.lg === 3 && 'lg:grid-cols-3',
    gridCols.lg === 4 && 'lg:grid-cols-4'
  );

  return (
    <div className={getPageContainerClasses()}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          {title !== undefined && (
            <Skeleton className="h-9 w-32" /> // h1 title
          )}
          {description !== undefined && (
            <Skeleton className="h-5 w-96" /> // description
          )}
        </div>
        {showActionButton && (
          <Skeleton className="h-10 w-32" /> // Action button
        )}
      </div>

      {/* Filters and Search */}
      {(showFilters || showSearch) && (
        <div className="flex flex-col sm:flex-row gap-4">
          {showSearch && (
            <Skeleton className="h-10 flex-1 max-w-md" /> // Search input
          )}
          {showFilters &&
            Array.from({ length: filterCount }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-[160px]" /> // Filter dropdown
            ))}
        </div>
      )}

      {/* Card Grid */}
      <div className={gridClass}>
        {Array.from({ length: cardCount }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * 카드 스켈레톤 (재사용 가능)
 */
export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="h-6 w-32" /> {/* Title */}
        <Skeleton className="h-6 w-16" /> {/* Badge */}
      </div>
      <Skeleton className="h-4 w-full" /> {/* Description line 1 */}
      <Skeleton className="h-4 w-3/4" /> {/* Description line 2 */}
      <div className="flex gap-4 pt-2">
        <Skeleton className="h-4 w-20" /> {/* Stat 1 */}
        <Skeleton className="h-4 w-20" /> {/* Stat 2 */}
      </div>
    </div>
  );
}

/**
 * 테이블 스켈레톤 (테이블 레이아웃용)
 */
export function TablePageSkeleton({
  title,
  description,
  showFilters = true,
  filterCount = 2,
  showSearch = true,
  rowCount = 10,
  columnCount = 5,
  showActionButton = true,
}: Omit<ListPageSkeletonProps, 'cardCount' | 'gridCols'> & {
  rowCount?: number;
  columnCount?: number;
}) {
  return (
    <div className={getPageContainerClasses()}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          {title !== undefined && <Skeleton className="h-9 w-32" />}
          {description !== undefined && <Skeleton className="h-5 w-96" />}
        </div>
        {showActionButton && <Skeleton className="h-10 w-32" />}
      </div>

      {/* Filters and Search */}
      {(showFilters || showSearch) && (
        <div className="flex flex-col sm:flex-row gap-4">
          {showSearch && <Skeleton className="h-10 flex-1 max-w-md" />}
          {showFilters &&
            Array.from({ length: filterCount }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-[160px]" />
            ))}
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="border-b bg-muted/50 p-4">
          <div className="flex gap-4">
            {Array.from({ length: columnCount }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
        </div>

        {/* Table Rows */}
        {Array.from({ length: rowCount }).map((_, i) => (
          <div key={i} className="border-b last:border-b-0 p-4">
            <div className="flex gap-4">
              {Array.from({ length: columnCount }).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
