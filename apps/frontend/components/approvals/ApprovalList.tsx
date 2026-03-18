'use client';

import { CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { ApprovalItem } from '@/lib/api/approvals-api';
import { ApprovalRow } from './ApprovalRow';
import {
  APPROVAL_EMPTY_STATE_TOKENS,
  APPROVAL_MOTION,
  APPROVAL_ROW_TOKENS,
} from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';

interface ApprovalListProps {
  items: ApprovalItem[];
  isLoading: boolean;
  selectedItems: string[];
  processingIds: Set<string>;
  /** exitingIds: id → 'success' | 'reject' 매핑 */
  exitingIds: Map<string, 'success' | 'reject'>;
  onToggleSelect: (id: string) => void;
  onApprove: (item: ApprovalItem) => void;
  onReject: (item: ApprovalItem) => void;
  onViewDetail: (item: ApprovalItem) => void;
  actionLabel: string;
  /** 오늘 처리 건수 (Empty state 표시용) */
  todayProcessed?: number | null;
}

export function ApprovalList({
  items,
  isLoading,
  selectedItems,
  processingIds,
  exitingIds,
  onToggleSelect,
  onApprove,
  onReject,
  onViewDetail,
  actionLabel,
  todayProcessed,
}: ApprovalListProps) {
  const t = useTranslations('approvals');

  if (isLoading) {
    return (
      <div className={APPROVAL_ROW_TOKENS.listContainer}>
        {/* Column header skeleton */}
        <div className={APPROVAL_ROW_TOKENS.container.header}>
          <Skeleton className="h-4 w-4" />
          <div />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-16" />
        </div>
        {/* Row skeletons */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`${APPROVAL_ROW_TOKENS.container.base} ${APPROVAL_ROW_TOKENS.container.desktop}`}
            style={{ animationDelay: APPROVAL_MOTION.listStagger(i) }}
          >
            <Skeleton className="h-4 w-4" />
            <div />
            <div className="space-y-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-24 hidden lg:block" />
            <Skeleton className="h-5 w-16 hidden lg:block" />
            <Skeleton className="h-5 w-12 hidden lg:block" />
            <Skeleton className="h-5 w-20 hidden lg:block" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    const tokens = APPROVAL_EMPTY_STATE_TOKENS;
    return (
      <div
        className={`border border-border rounded-lg ${tokens.container} ${tokens.bgGradient}`}
        role="status"
        aria-live="polite"
      >
        <div className={`${tokens.iconRing} ${tokens.iconRingExpand}`}>
          <CheckCircle2 className={tokens.icon} />
        </div>
        <p className={tokens.title}>{t('list.allClear')}</p>
        <p className={tokens.description}>{t('list.empty')}</p>
        {todayProcessed !== null && todayProcessed !== undefined && todayProcessed > 0 && (
          <div className={tokens.stat.container}>
            <div className={tokens.stat.label}>{t('kpi.todayProcessed')}</div>
            <div>
              <span className={tokens.stat.value}>{todayProcessed}</span>
              <span className={tokens.stat.unit}>{t('list.countUnit')}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={APPROVAL_ROW_TOKENS.listContainer} data-testid="approval-list">
      {/* Column headers — desktop only */}
      <div className={APPROVAL_ROW_TOKENS.container.header}>
        <div /> {/* checkbox col */}
        <div /> {/* urgency bar col */}
        <div>{t('row.colSummary')}</div>
        <div>{t('item.requester')}</div>
        <div>{t('item.requestDate')}</div>
        <div>{t('item.elapsedLabel')}</div>
        <div>{t('row.colActions')}</div>
      </div>

      {/* Rows */}
      {items.map((item, index) => (
        <div
          key={item.id}
          className={`${APPROVAL_MOTION.listItemEnter} [content-visibility:auto] [contain-intrinsic-size:0_64px]`}
          style={{ animationDelay: APPROVAL_MOTION.listStagger(index) }}
        >
          <ApprovalRow
            item={item}
            isSelected={selectedItems.includes(item.id)}
            isMutating={processingIds.has(item.id)}
            isExiting={exitingIds.get(item.id) || false}
            onToggleSelect={() => onToggleSelect(item.id)}
            onApprove={() => onApprove(item)}
            onReject={() => onReject(item)}
            onViewDetail={() => onViewDetail(item)}
            actionLabel={actionLabel}
          />
        </div>
      ))}
    </div>
  );
}
