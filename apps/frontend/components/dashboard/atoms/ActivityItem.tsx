'use client';

import { memo } from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { DASHBOARD_MOTION, DASHBOARD_RECENT_ACTIVITIES_TOKENS as RA } from '@/lib/design-tokens';
import { ACTIVITY_TYPES, DEFAULT_ACTIVITY_META } from '@/lib/config/recent-activities-config';
import type { RecentActivity } from '@/lib/api/dashboard-api';

export interface ActivityItemProps {
  activity: RecentActivity;
  /** 이미 resolve된 활동 타입 레이블 (부모가 i18n 처리 후 전달) */
  activityLabel: string;
  userActionText: string;
  /** undefined이면 "자세히 보기" 버튼을 렌더하지 않음 (라우트 미등록 타입) */
  viewDetailText?: string;
  onNavigate?: (activity: RecentActivity) => void;
}

export const ActivityItem = memo(function ActivityItem({
  activity,
  activityLabel,
  userActionText,
  viewDetailText,
  onNavigate,
}: ActivityItemProps) {
  const { fmtDateTime } = useDateFormatter();
  const activityInfo = ACTIVITY_TYPES[activity.type] ?? DEFAULT_ACTIVITY_META;
  const Icon = activityInfo.icon;

  const isApproval = activity.type.includes('approved');
  const isRejection = activity.type.includes('rejected');

  return (
    <div
      className={cn(
        `${RA.item} ${DASHBOARD_MOTION.instantBg} motion-reduce:transition-none`,
        'hover:bg-muted/50',
        isApproval && RA.rowApproval,
        isRejection && RA.rowRejection
      )}
    >
      <div
        className={cn(
          RA.iconContainer,
          isApproval && RA.iconContainerApproval,
          isRejection && RA.iconContainerRejection,
          !isApproval && !isRejection && RA.iconContainerDefault
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className={RA.content}>
        <div className="flex items-center flex-wrap gap-2">
          <Badge variant={activityInfo.variant} className="py-0.5 text-xs">
            {activityLabel}
          </Badge>
          <time dateTime={activity.timestamp} className={RA.meta}>
            <Clock className="inline-block h-3 w-3 mr-1" aria-hidden="true" />
            {fmtDateTime(activity.timestamp)}
          </time>
        </div>
        <p className="text-sm truncate">
          <span className="font-medium">{userActionText}</span>{' '}
          <span className="font-medium text-primary">{activity.entityName}</span>
          {activity.details ? ` ${activity.details}` : ''}
        </p>
        {viewDetailText && onNavigate && (
          <Button
            variant="link"
            size="sm"
            className={RA.viewDetailBtn}
            onClick={() => onNavigate(activity)}
          >
            {viewDetailText}
          </Button>
        )}
      </div>
    </div>
  );
});
