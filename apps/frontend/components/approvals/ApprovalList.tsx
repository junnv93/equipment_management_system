'use client';

import { memo, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ApprovalItem } from '@/lib/api/approvals-api';
import { ApprovalRow } from './ApprovalRow';
import { APPROVAL_EMPTY_STATE_TOKENS, APPROVAL_MOTION } from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';

interface ApprovalListProps {
  items: ApprovalItem[];
  isLoading: boolean;
  selectedItems: string[];
  processingIds: Set<string>;
  /** exitingIds: id → 'success' | 'reject' 매핑 */
  exitingIds: Map<string, 'success' | 'reject'>;
  onToggleSelect: (id: string, item: ApprovalItem) => void;
  onApprove: (item: ApprovalItem) => void;
  /** canReject: false인 카테고리(inspection 등)에서 undefined로 전달 — 반려 버튼 미표시 (AR-8) */
  onReject?: (item: ApprovalItem) => void;
  onViewDetail: (item: ApprovalItem) => void;
  actionLabel: string;
  /** 오늘 처리 건수 (Empty state 표시용) */
  todayProcessed?: number | null;
}

interface ApprovalRowItemProps {
  item: ApprovalItem;
  isSelected: boolean;
  isMutating: boolean;
  isExiting: 'success' | 'reject' | false;
  onToggleSelectItem: (id: string, item: ApprovalItem) => void;
  onApproveItem: (item: ApprovalItem) => void;
  onRejectItem?: (item: ApprovalItem) => void;
  onViewDetailItem: (item: ApprovalItem) => void;
  actionLabel: string;
}

/**
 * 파일-로컬 wrapper — item별 콜백을 useCallback으로 안정화하여
 * ApprovalRow(memo)의 불필요한 재렌더를 방지.
 */
const ApprovalRowItem = memo(function ApprovalRowItem({
  item,
  isSelected,
  isMutating,
  isExiting,
  onToggleSelectItem,
  onApproveItem,
  onRejectItem,
  onViewDetailItem,
  actionLabel,
}: ApprovalRowItemProps) {
  const handleToggleSelect = useCallback(
    () => onToggleSelectItem(item.id, item),
    [item, onToggleSelectItem]
  );
  const handleApprove = useCallback(() => onApproveItem(item), [item, onApproveItem]);
  const handleReject = useCallback(() => onRejectItem?.(item), [item, onRejectItem]);
  const handleViewDetail = useCallback(() => onViewDetailItem(item), [item, onViewDetailItem]);

  return (
    <ApprovalRow
      item={item}
      isSelected={isSelected}
      isMutating={isMutating}
      isExiting={isExiting}
      onToggleSelect={handleToggleSelect}
      onApprove={handleApprove}
      onReject={onRejectItem ? handleReject : undefined}
      onViewDetail={handleViewDetail}
      actionLabel={actionLabel}
    />
  );
});

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
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-12 w-full rounded-lg"
              style={{ animationDelay: APPROVAL_MOTION.listStagger(i) }}
            />
          ))}
        </div>
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
    <div className="border border-border rounded-lg overflow-hidden" data-testid="approval-list">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>{t('row.colSummary')}</TableHead>
            <TableHead className="hidden lg:table-cell">{t('item.requester')}</TableHead>
            <TableHead className="hidden lg:table-cell">{t('item.requestDate')}</TableHead>
            <TableHead className="hidden lg:table-cell">{t('item.elapsedLabel')}</TableHead>
            <TableHead className="w-12 text-right">{t('row.colActions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <ApprovalRowItem
              key={item.id}
              item={item}
              isSelected={selectedItems.includes(item.id)}
              isMutating={processingIds.has(item.id)}
              isExiting={exitingIds.get(item.id) ?? false}
              onToggleSelectItem={onToggleSelect}
              onApproveItem={onApprove}
              onRejectItem={onReject}
              onViewDetailItem={onViewDetail}
              actionLabel={actionLabel}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
