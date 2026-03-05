'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  Calendar,
  AlertCircle,
  Settings,
  Box,
  XCircle,
  ArrowLeft,
  Clock,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { getTransitionClasses } from '@/lib/design-tokens';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import type { NotificationItem as NotificationItemType } from '@/lib/api/notifications-api';
import type { NotificationCategory } from '@equipment-management/shared-constants';

/**
 * SSOT 기반 카테고리 스타일 매핑
 *
 * SSOT 체인:
 *   @equipment-management/shared-constants: NotificationCategory 정의
 *     → notification-registry.ts: 이벤트별 category 매핑
 *       → dispatcher.ts: DB에 category 저장
 *         → API response: { category: 'checkout' }
 *           → 이 매핑: 렌더링
 *
 * 새 이벤트 type이 기존 category에 추가되면 스타일 자동 적용.
 * 새 category 추가 시 shared-constants → 이 매핑 1줄 추가.
 */
interface CategoryStyle {
  icon: LucideIcon;
  color: string;
  borderColor: string;
  bgColor: string; // Icon background color
}

const CATEGORY_STYLE_MAP: Record<NotificationCategory, CategoryStyle> = {
  checkout: {
    icon: Box,
    color: 'text-orange-600 dark:text-orange-400',
    borderColor: 'border-l-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
  },
  calibration: {
    icon: Calendar,
    color: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-l-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
  },
  calibration_plan: {
    icon: Calendar,
    color: 'text-indigo-600 dark:text-indigo-400',
    borderColor: 'border-l-indigo-500',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
  },
  non_conformance: {
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    borderColor: 'border-l-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
  },
  disposal: {
    icon: XCircle,
    color: 'text-muted-foreground',
    borderColor: 'border-l-muted-foreground',
    bgColor: 'bg-muted/50',
  },
  equipment_import: {
    icon: ArrowLeft,
    color: 'text-purple-600 dark:text-purple-400',
    borderColor: 'border-l-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
  },
  equipment: {
    icon: Settings,
    color: 'text-teal-600 dark:text-teal-400',
    borderColor: 'border-l-teal-500',
    bgColor: 'bg-teal-100 dark:bg-teal-900/20',
  },
  system: {
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    borderColor: 'border-l-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
  },
};

const DEFAULT_STYLE: CategoryStyle = {
  icon: Bell,
  color: 'text-muted-foreground',
  borderColor: 'border-l-muted-foreground',
  bgColor: 'bg-muted/50',
};

function getCategoryStyle(category: string): CategoryStyle {
  return CATEGORY_STYLE_MAP[category as NotificationCategory] ?? DEFAULT_STYLE;
}

interface NotificationItemProps {
  notification: NotificationItemType;
  onMarkAsRead: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const t = useTranslations('notifications');
  const { fmtRelative, fmtDateTime } = useDateFormatter();
  const style = getCategoryStyle(notification.category);
  const Icon = style.icon;

  const formattedDate = fmtRelative(notification.createdAt);
  const fullDate = fmtDateTime(notification.createdAt);

  const handleMarkAsRead = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
  };

  const content = (
    <>
      {!notification.isRead && (
        <div
          className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary motion-safe:animate-badge-pulse"
          aria-hidden="true"
        >
          <span className="sr-only">{t('alerts.tabs.unread')}</span>
        </div>
      )}
      <div className="flex items-start gap-3">
        {/* Enhanced icon with background circle */}
        <div
          className={cn(
            'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
            'transition-transform duration-200 motion-safe:group-hover:scale-110',
            style.bgColor
          )}
        >
          <Icon className={cn('h-4 w-4', style.color)} aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title with improved typography */}
          <div className="font-semibold text-sm line-clamp-2 tracking-tight leading-snug">
            {notification.title}
          </div>

          {/* Content */}
          <div className="text-sm text-muted-foreground mt-1 line-clamp-3 leading-relaxed">
            {notification.content}
          </div>

          {/* Time with icon */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground/60 mt-2">
            <Clock className="h-3 w-3" aria-hidden="true" />
            <time dateTime={notification.createdAt} title={fullDate}>
              {formattedDate}
            </time>
          </div>
        </div>
      </div>
    </>
  );

  const baseClassName = cn(
    'group p-4 mb-2 rounded-lg shadow-sm relative border-l-4 block w-full text-left',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    getTransitionClasses('moderate', ['box-shadow', 'transform']),
    'motion-safe:hover:shadow-lg motion-safe:hover:scale-[1.01] motion-safe:hover:-translate-y-0.5',
    notification.isRead
      ? 'bg-muted/80 opacity-60'
      : 'bg-card motion-safe:animate-[pulseGlow_3s_ease-in-out_infinite]',
    style.borderColor
  );

  // 내부 링크가 있으면 Next.js Link (SPA 내비게이션)
  if (notification.linkUrl?.startsWith('/')) {
    return (
      <Link
        href={notification.linkUrl}
        className={baseClassName}
        title={fullDate}
        onClick={handleMarkAsRead}
      >
        {content}
      </Link>
    );
  }

  // 외부 링크가 있으면 <a> 태그
  if (notification.linkUrl) {
    return (
      <a
        href={notification.linkUrl}
        className={baseClassName}
        title={fullDate}
        onClick={handleMarkAsRead}
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }

  // 링크 없으면 button (읽음 처리만)
  return (
    <button type="button" className={baseClassName} title={fullDate} onClick={handleMarkAsRead}>
      {content}
    </button>
  );
}
