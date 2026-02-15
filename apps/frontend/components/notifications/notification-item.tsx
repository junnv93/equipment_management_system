'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Bell, Calendar, AlertCircle, Settings, Box, XCircle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, formatRelativeTime } from '@/lib/utils/date';
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
}

const CATEGORY_STYLE_MAP: Record<NotificationCategory, CategoryStyle> = {
  checkout: { icon: Box, color: 'text-orange-500', borderColor: 'border-l-orange-500' },
  calibration: { icon: Calendar, color: 'text-blue-500', borderColor: 'border-l-blue-500' },
  calibration_plan: {
    icon: Calendar,
    color: 'text-indigo-500',
    borderColor: 'border-l-indigo-500',
  },
  non_conformance: { icon: AlertCircle, color: 'text-red-500', borderColor: 'border-l-red-500' },
  disposal: {
    icon: XCircle,
    color: 'text-muted-foreground',
    borderColor: 'border-l-muted-foreground',
  },
  equipment_import: {
    icon: ArrowLeft,
    color: 'text-purple-500',
    borderColor: 'border-l-purple-500',
  },
  equipment: { icon: Settings, color: 'text-teal-500', borderColor: 'border-l-teal-500' },
  system: { icon: AlertCircle, color: 'text-red-600', borderColor: 'border-l-red-600' },
};

const DEFAULT_STYLE: CategoryStyle = {
  icon: Bell,
  color: 'text-muted-foreground',
  borderColor: 'border-l-muted-foreground',
};

function getCategoryStyle(category: string): CategoryStyle {
  return CATEGORY_STYLE_MAP[category as NotificationCategory] ?? DEFAULT_STYLE;
}

interface NotificationItemProps {
  notification: NotificationItemType;
  onMarkAsRead: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const style = getCategoryStyle(notification.category);
  const Icon = style.icon;

  const formattedDate = formatRelativeTime(notification.createdAt);
  const fullDate = formatDate(notification.createdAt, 'yyyy년 MM월 dd일 HH:mm');

  const handleMarkAsRead = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
  };

  const content = (
    <>
      {!notification.isRead && (
        <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary" />
      )}
      <div className="flex items-start">
        <div className="mr-3 mt-1">
          <Icon className={cn('h-4 w-4', style.color)} aria-hidden="true" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm">{notification.title}</div>
          <div className="text-sm text-muted-foreground mt-1">{notification.content}</div>
          <div className="text-xs text-muted-foreground/60 mt-2">{formattedDate}</div>
        </div>
      </div>
    </>
  );

  const baseClassName = cn(
    'p-4 mb-2 rounded shadow-sm relative border-l-4 block w-full text-left',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    notification.isRead ? 'opacity-60 bg-muted' : 'bg-card',
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
    <button
      type="button"
      className={cn(baseClassName, 'cursor-default')}
      title={fullDate}
      onClick={handleMarkAsRead}
    >
      {content}
    </button>
  );
}
