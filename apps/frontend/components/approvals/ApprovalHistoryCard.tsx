'use client';

import { formatDate } from '@/lib/utils/date';
import { Check, XCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ApprovalHistoryEntry } from '@/lib/api/approvals-api';
import { APPROVAL_TIMELINE_TOKENS } from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';

interface ApprovalHistoryCardProps {
  history: ApprovalHistoryEntry[];
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  review: Eye,
  approve: Check,
  reject: XCircle,
};

export function ApprovalHistoryCard({ history }: ApprovalHistoryCardProps) {
  const t = useTranslations('approvals');

  const actionLabels: Record<string, string> = {
    review: t('history.reviewCompleted'),
    approve: t('history.approved'),
    reject: t('history.rejected'),
  };

  if (!history || history.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">{t('history.empty')}</p>;
  }

  // 시간순 정렬 (최신이 아래로)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.actionAt).getTime() - new Date(b.actionAt).getTime()
  );

  return (
    <div className="space-y-3">
      {sortedHistory.map((entry, index) => {
        const IconComponent = ACTION_ICONS[entry.action] || Eye;
        const actionStyle =
          APPROVAL_TIMELINE_TOKENS.iconBadge[
            entry.action as keyof typeof APPROVAL_TIMELINE_TOKENS.iconBadge
          ] || APPROVAL_TIMELINE_TOKENS.iconBadge.review;

        return (
          <div
            key={`${entry.step}-${entry.actionAt}`}
            className={cn(
              'relative pl-8 pb-4',
              index < sortedHistory.length - 1 && APPROVAL_TIMELINE_TOKENS.connector
            )}
          >
            {/* 타임라인 아이콘 */}
            <div
              className={cn(
                'absolute left-0 top-0 flex items-center justify-center w-6 h-6 rounded-full',
                actionStyle
              )}
            >
              <IconComponent className="h-3 w-3" />
            </div>

            {/* 이력 내용 */}
            <div className="bg-muted/50 rounded-lg p-3 ml-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">
                  {actionLabels[entry.action] || entry.action}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(entry.actionAt, 'yyyy-MM-dd HH:mm')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {entry.actorName} ({entry.actorRole})
              </p>
              {entry.comment && (
                <p className={`mt-2 text-sm italic ${APPROVAL_TIMELINE_TOKENS.blockquote}`}>
                  &quot;{entry.comment}&quot;
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
