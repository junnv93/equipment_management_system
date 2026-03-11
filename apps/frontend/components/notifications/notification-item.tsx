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
import { NOTIFICATION_LIST_ITEM_TOKENS } from '@/lib/design-tokens';
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
    color: 'text-brand-repair',
    borderColor: 'border-l-brand-repair',
    bgColor: 'bg-brand-repair/10',
  },
  calibration: {
    icon: Calendar,
    color: 'text-brand-info',
    borderColor: 'border-l-brand-info',
    bgColor: 'bg-brand-info/10',
  },
  calibration_plan: {
    icon: Calendar,
    color: 'text-brand-purple',
    borderColor: 'border-l-brand-purple',
    bgColor: 'bg-brand-purple/10',
  },
  non_conformance: {
    icon: AlertCircle,
    color: 'text-brand-critical',
    borderColor: 'border-l-brand-critical',
    bgColor: 'bg-brand-critical/10',
  },
  disposal: {
    icon: XCircle,
    color: 'text-muted-foreground',
    borderColor: 'border-l-muted-foreground',
    bgColor: 'bg-muted/50',
  },
  equipment_import: {
    icon: ArrowLeft,
    color: 'text-brand-purple',
    borderColor: 'border-l-brand-purple',
    bgColor: 'bg-brand-purple/10',
  },
  equipment: {
    icon: Settings,
    color: 'text-brand-ok',
    borderColor: 'border-l-brand-ok',
    bgColor: 'bg-brand-ok/10',
  },
  system: {
    icon: AlertCircle,
    color: 'text-brand-critical',
    borderColor: 'border-l-brand-critical',
    bgColor: 'bg-brand-critical/10',
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

  const T = NOTIFICATION_LIST_ITEM_TOKENS;

  const content = (
    <>
      {!notification.isRead && (
        <div className={T.indicator.dot} aria-hidden="true">
          <span className="sr-only">{t('alerts.tabs.unread')}</span>
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className={cn(T.iconCircle, style.bgColor)}>
          <Icon className={cn(T.iconSize, style.color)} aria-hidden="true" />
        </div>

        <div className={T.content}>
          <div className={T.title}>{notification.title}</div>
          <div className={T.body}>{notification.content}</div>
          <div className={T.timeRow}>
            <Clock className={T.timeIcon} aria-hidden="true" />
            <time dateTime={notification.createdAt} title={fullDate}>
              {formattedDate}
            </time>
          </div>
        </div>
      </div>
    </>
  );

  const baseClassName = cn(
    T.card.base,
    notification.isRead ? T.card.read : T.card.unread,
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
