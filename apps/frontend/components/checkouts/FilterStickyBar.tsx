'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DIMENSION_TOKENS } from '@/lib/design-tokens';
import { useSavedViewCounts } from '@/hooks/use-saved-view-counts';

interface SystemView {
  key: 'all' | 'pendingApproval' | 'overdue';
  paramValue: string;
}

const SYSTEM_VIEWS: SystemView[] = [
  { key: 'all', paramValue: 'all' },
  { key: 'pendingApproval', paramValue: 'pending_approval' },
  { key: 'overdue', paramValue: 'overdue' },
];

/**
 * 반출 목록 sticky 필터 바.
 *
 * - `sticky top-[var(--sticky-header-height)]` SSOT 재사용 (DIMENSION_TOKENS)
 * - 하드코딩 px 0 — CSS 변수 기반
 * - 시스템 뷰 카운트 = backend 응답 (frontend 하드코딩 0)
 * - chip 클릭 → URL 쿼리 파라미터 변경 (localStorage write 0)
 */
export function FilterStickyBar() {
  const t = useTranslations('checkouts.savedViews');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const { data: counts } = useSavedViewCounts();
  const activeView = searchParams.get('systemView') ?? 'all';

  const handleViewSelect = (paramValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('systemView', paramValue);
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div
      role="navigation"
      aria-label={t('filterBar.label')}
      className={cn(
        'sticky z-10 flex items-center gap-2 border-b bg-background px-4 py-2',
        `${DIMENSION_TOKENS.stickyHeaderOffset}`
      )}
    >
      <span className="text-xs text-muted-foreground">{t('filterBar.savedViewsLabel')}:</span>
      <div className="flex flex-wrap gap-1.5">
        {SYSTEM_VIEWS.map(({ key, paramValue }) => (
          <Badge
            key={key}
            variant={activeView === paramValue ? 'default' : 'outline'}
            role="button"
            tabIndex={0}
            aria-pressed={activeView === paramValue}
            className={cn(
              'cursor-pointer select-none transition-colors',
              isPending && 'pointer-events-none opacity-50'
            )}
            onClick={() => handleViewSelect(paramValue)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleViewSelect(paramValue);
              }
            }}
          >
            {t(`systemViews.${key}` as 'systemViews.all')}
            {counts !== undefined && (
              <span className="ml-1 text-xs opacity-75">({counts[key]})</span>
            )}
          </Badge>
        ))}
      </div>
    </div>
  );
}
