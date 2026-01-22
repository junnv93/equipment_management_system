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
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  generateBreadcrumbs,
  generateMobileBreadcrumbs,
  getHomeBreadcrumb,
} from '@/lib/navigation/generate-breadcrumbs';

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
  const items = generateBreadcrumbs(pathname, dynamicLabels);

  // 브레드크럼이 없으면 렌더링하지 않음
  if (items.length === 0) {
    return null;
  }

  // maxItems가 설정된 경우 제한
  const displayItems = maxItems ? items.slice(-maxItems) : items;
  const hasMore = maxItems && items.length > maxItems;

  return (
    <nav
      aria-label="breadcrumb"
      className={cn('flex items-center gap-2', className)}
    >
      {/* 홈 아이콘 - 항상 표시 */}
      <Link
        href="/"
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-lg',
          'bg-ul-red hover:bg-ul-red/90 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-ul-info focus:ring-offset-2',
          'shrink-0' // 아이콘 크기 고정
        )}
        aria-label="홈으로 이동"
      >
        <Home className="h-4 w-4 text-white" aria-hidden="true" />
      </Link>

      {/* 생략 표시 (maxItems로 인해 숨겨진 항목이 있는 경우) */}
      {hasMore && (
        <>
          <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" aria-hidden="true" />
          <span className="text-sm text-gray-500" aria-hidden="true">
            ...
          </span>
        </>
      )}

      {/* 브레드크럼 항목들 (홈 제외) */}
      {displayItems.slice(1).map((item, index) => {
        const Icon = item.icon;

        return (
          <Fragment key={item.href}>
            <ChevronRight
              className="h-4 w-4 text-gray-400 shrink-0"
              aria-hidden="true"
            />

            {item.current ? (
              <span
                className={cn(
                  'text-sm font-medium text-gray-900 dark:text-gray-100',
                  'truncate max-w-[200px]'
                )}
                aria-current="page"
              >
                {Icon && <Icon className="inline h-3.5 w-3.5 mr-1" aria-hidden="true" />}
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  'text-sm text-gray-600 dark:text-gray-400',
                  'hover:text-gray-900 dark:hover:text-gray-100',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  'px-2 py-1 rounded transition-colors',
                  'truncate max-w-[200px]',
                  'focus:outline-none focus:ring-2 focus:ring-ul-info focus:ring-offset-2'
                )}
              >
                {Icon && <Icon className="inline h-3.5 w-3.5 mr-1" aria-hidden="true" />}
                {item.label}
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
  const allItems = generateBreadcrumbs(pathname, dynamicLabels);
  const items = generateMobileBreadcrumbs(allItems);

  // 브레드크럼이 없으면 렌더링하지 않음
  if (allItems.length === 0) {
    return null;
  }

  // 홈만 있는 경우 (대시보드 페이지)
  if (allItems.length === 1) {
    return (
      <nav aria-label="breadcrumb" className={cn('flex items-center gap-1', className)}>
        <Link
          href="/"
          className={cn(
            'flex items-center justify-center w-7 h-7 rounded-lg',
            'bg-ul-red hover:bg-ul-red/90 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-ul-info focus:ring-offset-2'
          )}
          aria-label="홈으로 이동"
        >
          <Home className="h-3.5 w-3.5 text-white" aria-hidden="true" />
        </Link>
      </nav>
    );
  }

  return (
    <nav aria-label="breadcrumb" className={cn('flex items-center gap-1', className)}>
      {/* 홈 아이콘 */}
      <Link
        href="/"
        className={cn(
          'flex items-center justify-center w-7 h-7 rounded-lg',
          'bg-ul-red hover:bg-ul-red/90 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-ul-info focus:ring-offset-2',
          'shrink-0'
        )}
        aria-label="홈으로 이동"
      >
        <Home className="h-3.5 w-3.5 text-white" aria-hidden="true" />
      </Link>

      {/* 마지막 항목만 표시 */}
      {items.length > 0 && (
        <>
          <ChevronRight className="h-3 w-3 text-gray-400 shrink-0" aria-hidden="true" />
          <span
            className={cn(
              'text-xs text-gray-700 dark:text-gray-300',
              'truncate max-w-[120px]',
              'font-medium'
            )}
            aria-current="page"
          >
            {items[items.length - 1].label}
          </span>
        </>
      )}
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
export function ResponsiveBreadcrumb({
  className,
  dynamicLabels,
  maxItems,
}: BreadcrumbProps) {
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
 * 컴팩트 브레드크럼 (아이콘만)
 *
 * 공간이 제한적인 경우 사용합니다.
 *
 * @example
 * <CompactBreadcrumb />
 */
export function CompactBreadcrumb({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded-lg',
        'bg-ul-red hover:bg-ul-red/90 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-ul-info focus:ring-offset-2',
        className
      )}
      aria-label="홈으로 이동"
    >
      <Home className="h-4 w-4 text-white" aria-hidden="true" />
    </Link>
  );
}

/**
 * 브레드크럼 스켈레톤 (로딩 상태)
 *
 * 브레드크럼 로딩 중 표시할 스켈레톤입니다.
 */
export function BreadcrumbSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex items-center gap-2 animate-pulse', className)}
      aria-label="브레드크럼 로딩 중"
    >
      {/* 홈 아이콘 스켈레톤 */}
      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />

      {/* 첫 번째 항목 */}
      <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
      <div className="w-20 h-5 bg-gray-200 dark:bg-gray-700 rounded" />

      {/* 두 번째 항목 */}
      <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
      <div className="w-24 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
}

// 기본 export
export default ResponsiveBreadcrumb;
