'use client';

import { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ResponsiveBreadcrumb } from './Breadcrumb';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';

interface HeaderProps {
  title?: string;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  className?: string;
  /** 브레드크럼 네비게이션 표시 여부 (기본값: true) */
  showBreadcrumb?: boolean;
  /** 동적 라우트의 커스텀 라벨 (Context와 병합됨) */
  dynamicLabels?: Record<string, string>;
}

export function Header({
  title,
  leftContent,
  rightContent,
  className,
  showBreadcrumb = true,
  dynamicLabels: propDynamicLabels,
}: HeaderProps) {
  const t = useTranslations('navigation');
  // Context에서 동적 라벨 가져오기
  const { dynamicLabels: contextDynamicLabels } = useBreadcrumb();

  // Context와 prop 라벨 병합 (prop이 우선순위)
  const mergedDynamicLabels = {
    ...contextDynamicLabels,
    ...propDynamicLabels,
  };
  return (
    <header
      role="banner"
      className={cn(
        'flex h-14 items-center gap-4 border-b border-border bg-card px-4 md:px-6',
        'sticky top-0 z-30',
        className
      )}
    >
      {/* 왼쪽 영역 (모바일 메뉴 등) */}
      <div className="flex items-center gap-2">{leftContent}</div>

      {/* 중앙: 브레드크럼 또는 제목 */}
      {showBreadcrumb ? (
        <div className="flex-1 min-w-0">
          <ResponsiveBreadcrumb dynamicLabels={mergedDynamicLabels} />
        </div>
      ) : (
        <h1 className="text-lg font-semibold truncate hidden sm:block">
          {title ?? t('layout.systemName')}
        </h1>
      )}

      {/* 오른쪽 영역 */}
      <div className="ml-auto flex items-center gap-2 md:gap-4">{rightContent}</div>
    </header>
  );
}
