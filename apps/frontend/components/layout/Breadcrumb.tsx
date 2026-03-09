'use client';

/**
 * Breadcrumb Navigation Component
 *
 * 계층적 브레드크럼 네비게이션을 제공합니다.
 * - 데스크톱: 전체 브레드크럼 표시
 * - 모바일: 축약 브레드크럼 (마지막 2단계)
 * - WCAG 2.1 AA 준수
 *
 * @module Breadcrumb
 */

import { Fragment } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateBreadcrumbs, type BreadcrumbItem } from '@/lib/navigation/generate-breadcrumbs';

const NAVIGATION_PREFIX = 'navigation.';

/** labelKey에서 'navigation.' 접두어를 제거하여 t() 호출용 키를 반환 */
function resolveLabelKey(item: BreadcrumbItem): string | undefined {
  if (!item.labelKey) return undefined;
  return item.labelKey.startsWith(NAVIGATION_PREFIX)
    ? item.labelKey.slice(NAVIGATION_PREFIX.length)
    : item.labelKey;
}

/**
 * Breadcrumb Props
 */
export interface BreadcrumbProps {
  /** 클래스명 */
  className?: string;
  /** 동적 라우트의 커스텀 라벨 (예: { 'abc-123': '디지털 멀티미터 DMM-2000' }) */
  dynamicLabels?: Record<string, string>;
  /** 최대 표시 아이템 수 (기본값: 무제한) */
  maxItems?: number;
}

/**
 * 데스크톱 브레드크럼 컴포넌트
 *
 * 전체 브레드크럼 경로를 표시합니다.
 *
 * @example
 * <Breadcrumb />
 * <Breadcrumb dynamicLabels={{ 'abc-123': '디지털 멀티미터' }} />
 */
export function Breadcrumb({ className, dynamicLabels, maxItems }: BreadcrumbProps) {
  const pathname = usePathname();
  const t = useTranslations('navigation');
  const items = generateBreadcrumbs(pathname, dynamicLabels);

  // 브레드크럼이 없으면 렌더링하지 않음
  if (items.length === 0) {
    return null;
  }

  // maxItems가 설정된 경우 제한
  const displayItems = maxItems ? items.slice(-maxItems) : items;
  const hasMore = maxItems && items.length > maxItems;

  return (
    <nav aria-label="breadcrumb" className={cn('flex items-center gap-1.5', className)}>
      {/* 생략 표시 (maxItems로 인해 숨겨진 항목이 있는 경우) */}
      {hasMore && (
        <>
          <span className="text-sm text-muted-foreground" aria-hidden="true">
            ...
          </span>
          <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" aria-hidden="true" />
        </>
      )}

      {/* 브레드크럼 항목들 (텍스트 기반) */}
      {displayItems.map((item, index) => {
        const Icon = item.icon;
        const isFirst = index === 0;
        const resolvedKey = resolveLabelKey(item);
        const displayLabel = resolvedKey ? t(resolvedKey as Parameters<typeof t>[0]) : item.label;

        return (
          <Fragment key={item.href}>
            {!isFirst && (
              <ChevronRight
                className="h-4 w-4 text-muted-foreground/60 shrink-0"
                aria-hidden="true"
              />
            )}

            {item.current ? (
              <span
                className={cn('text-sm font-medium text-foreground', 'truncate max-w-[200px]')}
                aria-current="page"
              >
                {Icon && <Icon className="inline h-3.5 w-3.5 mr-1" aria-hidden="true" />}
                {displayLabel}
              </span>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  'text-sm text-muted-foreground',
                  'hover:text-foreground',
                  'hover:underline',
                  'motion-safe:transition-colors motion-reduce:transition-none',
                  'truncate max-w-[200px]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ul-info focus-visible:ring-offset-2 rounded'
                )}
              >
                {Icon && <Icon className="inline h-3.5 w-3.5 mr-1" aria-hidden="true" />}
                {displayLabel}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}

/**
 * 모바일 브레드크럼 컴포넌트
 *
 * 축약된 브레드크럼 경로를 표시합니다 (마지막 2단계만).
 *
 * @example
 * <MobileBreadcrumb />
 */
export function MobileBreadcrumb({ className, dynamicLabels }: BreadcrumbProps) {
  const pathname = usePathname();
  const t = useTranslations('navigation');
  const allItems = generateBreadcrumbs(pathname, dynamicLabels);

  // 브레드크럼이 없으면 렌더링하지 않음
  if (allItems.length === 0) {
    return null;
  }

  // 현재 페이지 (마지막 항목)
  const currentItem = allItems[allItems.length - 1];
  const currentResolvedKey = resolveLabelKey(currentItem);
  const currentLabel = currentResolvedKey
    ? t(currentResolvedKey as Parameters<typeof t>[0])
    : currentItem.label;

  // 부모 페이지 (2단계: 상위 항목이 있을 때만)
  const parentItem = allItems.length > 1 ? allItems[allItems.length - 2] : null;
  const parentResolvedKey = parentItem ? resolveLabelKey(parentItem) : null;
  const parentLabel = parentItem
    ? parentResolvedKey
      ? t(parentResolvedKey as Parameters<typeof t>[0])
      : parentItem.label
    : null;

  return (
    <nav aria-label="breadcrumb" className={cn('flex items-center gap-1', className)}>
      {parentItem && parentLabel && (
        <>
          <Link
            href={parentItem.href}
            className={cn(
              'text-sm text-muted-foreground hover:text-foreground truncate max-w-[100px]',
              'motion-safe:transition-colors motion-reduce:transition-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded'
            )}
          >
            {parentLabel}
          </Link>
          <ChevronRight
            className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0"
            aria-hidden="true"
          />
        </>
      )}
      <span
        className={cn('text-sm text-foreground', 'truncate max-w-[180px]', 'font-medium')}
        aria-current="page"
      >
        {currentLabel}
      </span>
    </nav>
  );
}

/**
 * 반응형 브레드크럼 컴포넌트
 *
 * 화면 크기에 따라 자동으로 전체/축약 브레드크럼을 표시합니다.
 *
 * @example
 * <ResponsiveBreadcrumb />
 */
export function ResponsiveBreadcrumb({ className, dynamicLabels, maxItems }: BreadcrumbProps) {
  return (
    <>
      {/* 데스크톱 (≥768px) */}
      <div className={cn('hidden md:block', className)}>
        <Breadcrumb dynamicLabels={dynamicLabels} maxItems={maxItems} />
      </div>

      {/* 모바일 (<768px) */}
      <div className={cn('md:hidden', className)}>
        <MobileBreadcrumb dynamicLabels={dynamicLabels} />
      </div>
    </>
  );
}

/**
 * 브레드크럼 스켈레톤 (로딩 상태)
 *
 * 브레드크럼 로딩 중 표시할 스켈레톤입니다.
 */
export function BreadcrumbSkeleton({ className }: { className?: string }) {
  const t = useTranslations('navigation');

  return (
    <div
      className={cn('flex items-center gap-1.5 motion-safe:animate-pulse', className)}
      aria-label={t('layout.breadcrumbLoading')}
    >
      {/* 첫 번째 항목 */}
      <div className="w-16 h-5 bg-muted rounded" />

      {/* 구분자 */}
      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />

      {/* 두 번째 항목 */}
      <div className="w-24 h-5 bg-muted rounded" />
    </div>
  );
}

// 기본 export
export default ResponsiveBreadcrumb;
