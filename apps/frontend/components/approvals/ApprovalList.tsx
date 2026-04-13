'use client';

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
            <ApprovalRow
              key={item.id}
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
