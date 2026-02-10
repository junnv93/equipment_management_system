'use client';

import { formatDate } from '@/lib/utils/date';
import { Check, XCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ApprovalHistoryEntry } from '@/lib/api/approvals-api';

interface ApprovalHistoryCardProps {
  history: ApprovalHistoryEntry[];
}

const ACTION_LABELS: Record<string, string> = {
  review: '검토 완료',
  approve: '승인',
  reject: '반려',
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  review: Eye,
  approve: Check,
  reject: XCircle,
};

const ACTION_STYLES: Record<string, string> = {
  review: 'bg-ul-blue text-white',
  approve: 'bg-ul-green text-white',
  reject: 'bg-ul-red text-white',
};

export function ApprovalHistoryCard({ history }: ApprovalHistoryCardProps) {
  if (!history || history.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">승인 이력이 없습니다.</p>;
  }

  // 시간순 정렬 (최신이 아래로)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.actionAt).getTime() - new Date(b.actionAt).getTime()
  );

  return (
    <div className="space-y-3">
      {sortedHistory.map((entry, index) => {
        const IconComponent = ACTION_ICONS[entry.action] || Eye;
        const actionStyle = ACTION_STYLES[entry.action] || ACTION_STYLES.review;

        return (
          <div
            key={`${entry.step}-${entry.actionAt}`}
            className={cn(
              'relative pl-8 pb-4',
              index < sortedHistory.length - 1 && 'border-l-2 border-gray-200 ml-3'
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
                  {ACTION_LABELS[entry.action] || entry.action}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(entry.actionAt, 'yyyy-MM-dd HH:mm')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {entry.actorName} ({entry.actorRole})
              </p>
              {entry.comment && (
                <p className="mt-2 text-sm italic border-l-2 border-gray-300 pl-2">
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
