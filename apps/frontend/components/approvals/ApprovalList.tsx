'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { ApprovalItem } from '@/lib/api/approvals-api';
import { ApprovalItemCard } from './ApprovalItem';
import { APPROVAL_EMPTY_STATE_TOKENS, APPROVAL_MOTION } from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';

interface ApprovalListProps {
  items: ApprovalItem[];
  isLoading: boolean;
  selectedItems: string[];
  processingIds: Set<string>;
  exitingIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onApprove: (item: ApprovalItem) => void;
  onReject: (item: ApprovalItem) => void;
  onViewDetail: (item: ApprovalItem) => void;
  actionLabel: string;
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
}: ApprovalListProps) {
  const t = useTranslations('approvals');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className={`h-6 w-32 ${APPROVAL_MOTION.skeleton}`} />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card
              key={i}
              className="border-l-4 border-l-border"
              style={{ animationDelay: APPROVAL_MOTION.listStagger(i) }}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-48" />
                    </div>
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-16" />
                    <Skeleton className="h-9 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('list.title')}</CardTitle>
        <CardDescription>{t('list.countDescription', { count: items.length })}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className={APPROVAL_EMPTY_STATE_TOKENS.text} role="status" aria-live="polite">
            <div className={APPROVAL_EMPTY_STATE_TOKENS.iconContainer}>
              <Clock className={APPROVAL_EMPTY_STATE_TOKENS.icon} />
            </div>
            <p>{t('list.empty')}</p>
          </div>
        ) : (
          <div className="space-y-4" data-testid="approval-list">
            {items.map((item, index) => (
              <div
                key={item.id}
                className={`${APPROVAL_MOTION.listItemEnter} [content-visibility:auto] [contain-intrinsic-size:0_120px]`}
                style={{ animationDelay: APPROVAL_MOTION.listStagger(index) }}
              >
                <ApprovalItemCard
                  item={item}
                  isSelected={selectedItems.includes(item.id)}
                  isMutating={processingIds.has(item.id)}
                  isExiting={exitingIds.has(item.id)}
                  onToggleSelect={() => onToggleSelect(item.id)}
                  onApprove={() => onApprove(item)}
                  onReject={() => onReject(item)}
                  onViewDetail={() => onViewDetail(item)}
                  actionLabel={actionLabel}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
